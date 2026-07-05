import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { placeListItems, placeLists, places, users } from "../db/schema";
import type { AuthTokenPayload } from "../lib/jwt";
import { isUuid } from "../lib/uuid";
import { authGuard } from "../middleware/auth-guard";
import type { PlaceList, PlaceListDetail, PlaceListPlace, SharedPlaceList } from "../features/place-lists/types";

type ListRow = typeof placeLists.$inferSelect;

const createListSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

const updateListSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

const addPlaceSchema = z.object({
  placeId: z.uuid(),
});

function toPlaceList(row: ListRow, placeCount: number): PlaceList {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    placeCount,
    isShared: row.shareToken !== null,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPlaceListPlace(
  place: typeof places.$inferSelect,
  addedAt: string,
): PlaceListPlace {
  return {
    id: place.id,
    canonicalName: place.canonicalName,
    category: place.category,
    location: {
      text: place.locationText,
      lat: place.lat,
      lng: place.lng,
    },
    addedAt,
  };
}

async function getOwnedList(db: ReturnType<typeof getDb>, listId: string, userId: string) {
  const [list] = await db
    .select()
    .from(placeLists)
    .where(and(eq(placeLists.id, listId), eq(placeLists.userId, userId)))
    .limit(1);
  return list;
}

async function getListPlaceCount(db: ReturnType<typeof getDb>, listId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(placeListItems)
    .where(eq(placeListItems.listId, listId));
  return result?.value ?? 0;
}

async function getListPlaces(db: ReturnType<typeof getDb>, listId: string): Promise<PlaceListPlace[]> {
  const rows = await db
    .select({
      place: places,
      addedAt: placeListItems.createdAt,
    })
    .from(placeListItems)
    .innerJoin(places, eq(placeListItems.placeId, places.id))
    .where(eq(placeListItems.listId, listId))
    .orderBy(asc(placeListItems.createdAt));

  return rows.map((row) => toPlaceListPlace(row.place, row.addedAt));
}

export const placeListsRoute = new Hono<{ Variables: { user: AuthTokenPayload } }>()
  .post("/", authGuard, zValidator("json", createListSchema), async (c) => {
    const { name, description } = c.req.valid("json");
    const user = c.get("user");
    const db = getDb();

    const [list] = await db
      .insert(placeLists)
      .values({
        userId: user.sub,
        name,
        description,
      })
      .returning();

    const detail: PlaceListDetail = {
      ...toPlaceList(list, 0),
      places: [],
    };

    return c.json({ list: detail }, 201);
  })
  .get("/", authGuard, async (c) => {
    const user = c.get("user");
    const db = getDb();

    const rows = await db
      .select({
        list: placeLists,
        placeCount: count(placeListItems.id),
      })
      .from(placeLists)
      .leftJoin(placeListItems, eq(placeLists.id, placeListItems.listId))
      .where(eq(placeLists.userId, user.sub))
      .groupBy(placeLists.id)
      .orderBy(placeLists.updatedAt);

    return c.json({
      lists: rows.map((row) => toPlaceList(row.list, row.placeCount)),
    });
  })
  .get("/:id", authGuard, async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    const listPlaces = await getListPlaces(db, listId);
    const detail: PlaceListDetail = {
      ...toPlaceList(list, listPlaces.length),
      places: listPlaces,
    };

    return c.json({ list: detail });
  })
  .patch("/:id", authGuard, zValidator("json", updateListSchema), async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const body = c.req.valid("json");
    if (body.name === undefined && body.description === undefined) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    const [updated] = await db
      .update(placeLists)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(placeLists.id, listId))
      .returning();

    const placeCount = await getListPlaceCount(db, listId);
    return c.json({ list: toPlaceList(updated, placeCount) });
  })
  .delete("/:id", authGuard, async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    await db.delete(placeLists).where(eq(placeLists.id, listId));
    return c.body(null, 204);
  })
  .post("/:id/places", authGuard, zValidator("json", addPlaceSchema), async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const { placeId } = c.req.valid("json");
    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    const [place] = await db.select().from(places).where(eq(places.id, placeId)).limit(1);
    if (!place) {
      return c.json({ error: "Place not found" }, 404);
    }

    const [item] = await db
      .insert(placeListItems)
      .values({ listId, placeId })
      .onConflictDoNothing({ target: [placeListItems.listId, placeListItems.placeId] })
      .returning();

    if (!item) {
      return c.json({ error: "Place already in list" }, 409);
    }

    await db
      .update(placeLists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(placeLists.id, listId));

    return c.json({ place: toPlaceListPlace(place, item.createdAt) }, 201);
  })
  .delete("/:id/places/:placeId", authGuard, async (c) => {
    const listId = c.req.param("id");
    const placeId = c.req.param("placeId");

    if (!isUuid(listId) || !isUuid(placeId)) {
      return c.json({ error: "Invalid id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    const [removed] = await db
      .delete(placeListItems)
      .where(and(eq(placeListItems.listId, listId), eq(placeListItems.placeId, placeId)))
      .returning();

    if (!removed) {
      return c.json({ error: "Place not in list" }, 404);
    }

    await db
      .update(placeLists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(placeLists.id, listId));

    return c.body(null, 204);
  })
  .post("/:id/share", authGuard, async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    if (list.shareToken) {
      return c.json({ shareToken: list.shareToken });
    }

    const shareToken = crypto.randomUUID();
    const [updated] = await db
      .update(placeLists)
      .set({
        shareToken,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(placeLists.id, listId))
      .returning();

    return c.json({ shareToken: updated.shareToken });
  })
  .delete("/:id/share", authGuard, async (c) => {
    const listId = c.req.param("id");
    if (!isUuid(listId)) {
      return c.json({ error: "Invalid list id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();
    const list = await getOwnedList(db, listId, user.sub);

    if (!list) {
      return c.json({ error: "List not found" }, 404);
    }

    await db
      .update(placeLists)
      .set({
        shareToken: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(placeLists.id, listId));

    return c.body(null, 204);
  });

export const sharedPlaceListsRoute = new Hono().get("/:shareToken", async (c) => {
  const shareToken = c.req.param("shareToken");
  if (!isUuid(shareToken)) {
    return c.json({ error: "Invalid share token" }, 400);
  }

  const db = getDb();
  const [row] = await db
    .select({
      list: placeLists,
      ownerFirstName: users.firstName,
    })
    .from(placeLists)
    .innerJoin(users, eq(placeLists.userId, users.id))
    .where(eq(placeLists.shareToken, shareToken))
    .limit(1);

  if (!row) {
    return c.json({ error: "Shared list not found" }, 404);
  }

  const listPlaces = await getListPlaces(db, row.list.id);
  const shared: SharedPlaceList = {
    name: row.list.name,
    description: row.list.description,
    owner: {
      firstName: row.ownerFirstName,
    },
    places: listPlaces,
  };

  return c.json({ list: shared });
});

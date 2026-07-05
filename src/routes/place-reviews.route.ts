import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { placeReviews, places, users } from "../db/schema";
import type { AuthTokenPayload } from "../lib/jwt";
import { verifyAuthToken } from "../lib/jwt";
import { isUuid } from "../lib/uuid";
import { authGuard } from "../middleware/auth-guard";
import type { MyPlaceReview, PlaceRatingAggregate, PlaceReview } from "../features/reviews/types";

type ReviewRow = typeof placeReviews.$inferSelect;

const upsertReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

function toReview(
  row: ReviewRow,
  author: { id: string; firstName: string; image: string | null },
): PlaceReview {
  return {
    id: row.id,
    placeId: row.placeId,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author,
  };
}

/** Recomputes rating_avg / rating_count on places from place_reviews. */
async function refreshPlaceRating(
  db: ReturnType<typeof getDb>,
  placeId: string,
): Promise<PlaceRatingAggregate> {
  const [updated] = await db
    .update(places)
    .set({
      ratingAvg: sql`(SELECT ROUND(AVG(rating)::numeric, 2) FROM place_reviews WHERE place_id = ${placeId})`,
      ratingCount: sql`(SELECT COUNT(*)::int FROM place_reviews WHERE place_id = ${placeId})`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(places.id, placeId))
    .returning({ ratingAvg: places.ratingAvg, ratingCount: places.ratingCount });

  return {
    ratingAvg: updated?.ratingAvg !== null && updated?.ratingAvg !== undefined ? Number(updated.ratingAvg) : null,
    ratingCount: updated?.ratingCount ?? 0,
  };
}

/** Optional auth: returns the JWT payload if a valid Bearer token is present, else null. */
async function getOptionalUser(authorization: string | undefined): Promise<AuthTokenPayload | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    return await verifyAuthToken(authorization.slice("Bearer ".length));
  } catch {
    return null;
  }
}

export const placeReviewsRoute = new Hono<{ Variables: { user: AuthTokenPayload } }>()
  .get("/:id/reviews", async (c) => {
    const placeId = c.req.param("id");
    if (!isUuid(placeId)) {
      return c.json({ error: "Invalid place id" }, 400);
    }

    const limit = Math.min(Number(c.req.query("limit") ?? 20) || 20, 50);
    const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0);

    const db = getDb();

    const [place] = await db
      .select({ id: places.id, ratingAvg: places.ratingAvg, ratingCount: places.ratingCount })
      .from(places)
      .where(eq(places.id, placeId))
      .limit(1);

    if (!place) {
      return c.json({ error: "Place not found" }, 404);
    }

    const viewer = await getOptionalUser(c.req.header("Authorization"));

    const rows = await db
      .select({
        review: placeReviews,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorImage: users.image,
      })
      .from(placeReviews)
      .innerJoin(users, eq(placeReviews.userId, users.id))
      .where(
        viewer
          ? and(eq(placeReviews.placeId, placeId), ne(placeReviews.userId, viewer.sub))
          : eq(placeReviews.placeId, placeId),
      )
      .orderBy(desc(placeReviews.updatedAt))
      .limit(limit)
      .offset(offset);

    let myReview: PlaceReview | null = null;
    if (viewer) {
      const [mine] = await db
        .select({
          review: placeReviews,
          authorId: users.id,
          authorFirstName: users.firstName,
          authorImage: users.image,
        })
        .from(placeReviews)
        .innerJoin(users, eq(placeReviews.userId, users.id))
        .where(and(eq(placeReviews.placeId, placeId), eq(placeReviews.userId, viewer.sub)))
        .limit(1);
      if (mine) {
        myReview = toReview(mine.review, {
          id: mine.authorId,
          firstName: mine.authorFirstName,
          image: mine.authorImage,
        });
      }
    }

    return c.json({
      reviews: rows.map((row) =>
        toReview(row.review, {
          id: row.authorId,
          firstName: row.authorFirstName,
          image: row.authorImage,
        }),
      ),
      myReview,
      ratingAvg: place.ratingAvg !== null ? Number(place.ratingAvg) : null,
      ratingCount: place.ratingCount,
    });
  })
  .put("/:id/reviews", authGuard, zValidator("json", upsertReviewSchema), async (c) => {
    const placeId = c.req.param("id");
    if (!isUuid(placeId)) {
      return c.json({ error: "Invalid place id" }, 400);
    }

    const { rating, comment } = c.req.valid("json");
    const user = c.get("user");
    const db = getDb();

    const [place] = await db.select({ id: places.id }).from(places).where(eq(places.id, placeId)).limit(1);
    if (!place) {
      return c.json({ error: "Place not found" }, 404);
    }

    const [review] = await db
      .insert(placeReviews)
      .values({
        userId: user.sub,
        placeId,
        rating,
        comment: comment || null,
      })
      .onConflictDoUpdate({
        target: [placeReviews.userId, placeReviews.placeId],
        set: {
          rating,
          comment: comment || null,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    const aggregate = await refreshPlaceRating(db, placeId);

    const [author] = await db
      .select({ id: users.id, firstName: users.firstName, image: users.image })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    return c.json({
      review: toReview(review, author ?? { id: user.sub, firstName: "User", image: null }),
      ...aggregate,
    });
  })
  .delete("/:id/reviews", authGuard, async (c) => {
    const placeId = c.req.param("id");
    if (!isUuid(placeId)) {
      return c.json({ error: "Invalid place id" }, 400);
    }

    const user = c.get("user");
    const db = getDb();

    const [removed] = await db
      .delete(placeReviews)
      .where(and(eq(placeReviews.placeId, placeId), eq(placeReviews.userId, user.sub)))
      .returning();

    if (!removed) {
      return c.json({ error: "Review not found" }, 404);
    }

    const aggregate = await refreshPlaceRating(db, placeId);
    return c.json(aggregate);
  });

export const myReviewsRoute = new Hono<{ Variables: { user: AuthTokenPayload } }>().get(
  "/reviews",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const db = getDb();

    const rows = await db
      .select({
        review: placeReviews,
        placeName: places.canonicalName,
        placeLocation: places.locationText,
        placeCategory: places.category,
      })
      .from(placeReviews)
      .innerJoin(places, eq(placeReviews.placeId, places.id))
      .where(eq(placeReviews.userId, user.sub))
      .orderBy(desc(placeReviews.updatedAt));

    const reviews: MyPlaceReview[] = rows.map((row) => ({
      id: row.review.id,
      rating: row.review.rating,
      comment: row.review.comment,
      createdAt: row.review.createdAt,
      updatedAt: row.review.updatedAt,
      place: {
        id: row.review.placeId,
        canonicalName: row.placeName,
        locationText: row.placeLocation,
        category: row.placeCategory,
      },
    }));

    return c.json({ reviews });
  },
);

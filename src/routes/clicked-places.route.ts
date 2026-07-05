import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getDb } from "../db/client";
import { clickedPlaces } from "../db/schema";

const createClickedPlaceSchema = z.object({
  placeId: z.string().min(1),
  creation: z.iso.date().optional(),
});

export const clickedPlacesRoute = new Hono().post("/", zValidator("json", createClickedPlaceSchema), async (c) => {
  const { placeId, creation } = c.req.valid("json");
  const db = getDb();
  const userId = null;

  const [clickedPlace] = await db
    .insert(clickedPlaces)
    .values({
      uuid: crypto.randomUUID(),
      userId,
      placeId,
      creation: creation ?? new Date().toISOString().slice(0, 10),
    })
    .returning();

  return c.json({ clickedPlace }, 201);
});

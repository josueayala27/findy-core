import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { places, placeMentions } from "../db/schema";
import type { Place, PlaceMention } from "../features/places/types";
import { isUuid } from "../lib/uuid";

type PlaceRow = typeof places.$inferSelect;
type MentionRow = typeof placeMentions.$inferSelect;

function toMention(row: MentionRow): PlaceMention {
  return {
    id: row.id,
    videoId: row.videoId,
    source: row.source,
    sourceUrl: row.sourceUrl,
    sentiment: row.sentiment,
    sentimentScore: Number(row.sentimentScore),
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    bookmarks: row.bookmarks,
    summary: row.summary,
    locationText: row.locationText,
    evidence: row.evidence,
    createdAt: row.createdAt,
  };
}

function toPlace(row: PlaceRow, mentions: MentionRow[]): Place {
  return {
    id: row.id,
    canonicalName: row.canonicalName,
    category: row.category,
    location: {
      text: row.locationText,
      lat: row.lat,
      lng: row.lng,
      department: row.department,
      municipality: row.municipality,
    },
    verification: {
      status: row.verificationStatus,
      score: row.verificationScore ? Number(row.verificationScore) : null,
      suspiciousLocation: row.suspiciousLocation,
      googlePlaceId: row.googlePlaceId,
    },
    trending: {
      mentionCount: row.mentionCount,
      totalLikes: row.totalLikes,
      totalComments: row.totalComments,
      totalShares: row.totalShares,
      totalBookmarks: row.totalBookmarks,
    },
    mentions: mentions.map(toMention),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const placesRoute = new Hono().get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid place id" }, 400);
  }

  const db = getDb();

  const [place] = await db
    .select()
    .from(places)
    .where(eq(places.id, id))
    .limit(1);

  if (!place) {
    return c.json({ error: "Place not found" }, 404);
  }

  const mentions = await db
    .select()
    .from(placeMentions)
    .where(eq(placeMentions.placeId, id));

  return c.json({ place: toPlace(place, mentions) });
});

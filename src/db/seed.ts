import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { places, placeMentions } from "./schema";

process.loadEnvFile(".env");

type PlaceInsert = typeof places.$inferInsert;
type MentionInsert = Omit<typeof placeMentions.$inferInsert, "placeId">;

interface SeedEntry {
  place: PlaceInsert;
  mentions: MentionInsert[];
}

const seed: SeedEntry[] = [
  {
    place: {
      canonicalName: "Playa El Tunco",
      locationText: "El Tunco, La Libertad, El Salvador",
      lat: 13.4927,
      lng: -89.3823,
      category: "beach",
      mentionCount: 1,
      totalLikes: 21000,
      totalComments: 320,
      totalShares: 540,
      totalBookmarks: 1200,
    },
    mentions: [
      {
        videoId: "tt-eltunco-1",
        sentiment: "positive",
        sentimentScore: "0.81",
        likes: 21000,
        comments: 320,
        shares: 540,
        bookmarks: 1200,
        summary: "Sunset surf session at El Tunco; viewers love the vibe.",
        locationText: "El Tunco, La Libertad, El Salvador",
      },
    ],
  },
  {
    place: {
      canonicalName: "Playa El Zonte",
      locationText: "El Zonte, Chiltiupán, La Libertad, El Salvador",
      lat: 13.4989,
      lng: -89.4419,
      category: "beach",
      mentionCount: 1,
      totalLikes: 15400,
      totalComments: 180,
      totalShares: 300,
      totalBookmarks: 900,
    },
    mentions: [
      {
        videoId: "tt-elzonte-1",
        sentiment: "positive",
        sentimentScore: "0.77",
        likes: 15400,
        comments: 180,
        shares: 300,
        bookmarks: 900,
        summary: "Morning waves at El Zonte; chill Bitcoin Beach atmosphere.",
        locationText: "El Zonte, Chiltiupán, La Libertad, El Salvador",
      },
    ],
  },
];

async function run() {
  const db = getDb();

  for (const entry of seed) {
    const [place] = await db
      .insert(places)
      .values(entry.place)
      .onConflictDoUpdate({
        target: places.canonicalName,
        set: {
          locationText: entry.place.locationText,
          lat: entry.place.lat,
          lng: entry.place.lng,
          category: entry.place.category,
          mentionCount: entry.place.mentionCount,
          totalLikes: entry.place.totalLikes,
          totalComments: entry.place.totalComments,
          totalShares: entry.place.totalShares,
          totalBookmarks: entry.place.totalBookmarks,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    for (const mention of entry.mentions) {
      await db
        .insert(placeMentions)
        .values({ ...mention, placeId: place.id })
        .onConflictDoNothing({ target: placeMentions.videoId });
    }

    console.log(`Seeded ${place.canonicalName} (${place.id})`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

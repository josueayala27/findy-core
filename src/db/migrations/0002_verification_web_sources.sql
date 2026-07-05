ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "google_place_id" text;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "verification_status" text DEFAULT 'unverified' NOT NULL;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "verification_score" numeric;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "department" text;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "municipality" text;

CREATE UNIQUE INDEX IF NOT EXISTS "places_google_place_id_key"
  ON "places" USING btree ("google_place_id")
  WHERE "google_place_id" IS NOT NULL;

ALTER TABLE "place_mentions" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'tiktok' NOT NULL;
ALTER TABLE "place_mentions" ADD COLUMN IF NOT EXISTS "source_url" text;
ALTER TABLE "place_mentions" ADD COLUMN IF NOT EXISTS "evidence" text;

DROP INDEX IF EXISTS "place_mentions_video_id_place_id_key";
DROP INDEX IF EXISTS "place_mentions_place_id_source_ref_key";

CREATE UNIQUE INDEX IF NOT EXISTS "place_mentions_place_id_source_video_key"
  ON "place_mentions" USING btree ("place_id", "source", "video_id");

CREATE TABLE IF NOT EXISTS "web_sources" (
  "url" text PRIMARY KEY NOT NULL,
  "domain" text NOT NULL,
  "category" text,
  "scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL
);

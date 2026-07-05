ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "suspicious_location" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "place_mentions" ADD COLUMN IF NOT EXISTS "transcript" text;--> statement-breakpoint
DROP INDEX IF EXISTS "place_mentions_video_id_key";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "place_mentions_video_id_place_id_key" ON "place_mentions" USING btree ("video_id" text_ops,"place_id" uuid_ops);

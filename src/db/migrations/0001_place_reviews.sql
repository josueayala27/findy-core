-- Place reviews: user star ratings (1-5) + optional comment, one per user per place.
-- Aggregate columns on places keep avg/count denormalized for ranking & display.

CREATE TABLE IF NOT EXISTS place_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  place_id    uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CONSTRAINT place_reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT place_reviews_user_id_place_id_key UNIQUE (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS place_reviews_place_id_idx ON place_reviews (place_id);
CREATE INDEX IF NOT EXISTS place_reviews_user_id_idx  ON place_reviews (user_id);

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS rating_avg   numeric(3,2),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

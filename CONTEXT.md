# findy-core

The canonical backend API for Findy. Owns authentication, users, and (now) the read API for places surfaced to the app.

## Language

**Place**:
The atomic unit of the product: a real-world location (beach, restaurant, nightlife spot) aggregated from social video evidence. Stored in Neon Postgres as an aggregate row (identified by a UUID `id`, unique by `canonical_name`) holding rolled-up engagement (`mention_count`, `total_likes/comments/shares/bookmarks`). Embeddings for search live in Upstash Vector.
_Avoid_: Spot, venue, location (see below), POI

**Place Mention**:
A single social-video occurrence of a Place (`place_mentions`), FK to `places.id`. Carries per-video `sentiment`, `sentiment_score`, engagement counts, and a `summary`. Mentions are the evidence that aggregates into a Place.
_Avoid_: video, post, evidence

**canonical_name**:
The unique human name that dedupes a Place across many mentions. The natural key for upserts.
_Avoid_: name, title

**location**:
The geographic info of a Place (`location_text`, `lat`, `lng`), all nullable until geocoded. Never used as a synonym for Place itself.

**Search**:
Text-query lookup of places. Runs frontend → Upstash Vector directly, returning a place id that the client then passes to findy-core. Does NOT go through findy-core.
_Avoid_: query, filter, list

**Place Detail**:
The full information for a single Place (aggregate row + its mentions), retrieved when a user opens a place to "know more". Served by findy-core from Neon Postgres via `GET /places/:id` (id = `places.id` UUID).
_Avoid_: place info, place page

# Place detail in Postgres, search in Upstash

Search runs client-side against Upstash Vector, which returns `id_place` values; the client then calls findy-core `GET /places/:id` to load full place detail from Neon Postgres. We split responsibilities this way because Upstash is optimized for vector similarity search while Postgres is the durable source of truth for the structured place record, and routing detail through findy-core keeps datastore credentials server-side and gives us one API boundary to add auth, rate-limiting, or enrichment later.

## Considered Options

- **All Upstash**: serve detail from Upstash metadata too. Rejected — makes the vector index the source of truth for structured data it isn't suited for, and forces every consumer to hold Upstash credentials.
- **All Postgres** (search included, e.g. pgvector): one datastore, but search already works against Upstash on the client and moving it now is out of scope.
- **API proxy to the frontend's existing `/api/places`**: rejected — findy-core is meant to be the canonical backend, not a client of the Next.js app.

## Consequences

- The Postgres model is normalized: a `places` aggregate (UUID `id`, unique `canonical_name`, rolled-up engagement) with many `place_mentions` (per-video sentiment + engagement). It already exists in Neon, provisioned by the ingestion pipeline — findy-core reads it, it does not own migrations for it.
- `GET /places/:id` keys on the `places.id` UUID; the exact identifier the Upstash search returns must line up with this (confirm during frontend wiring).
- Upstash holds embeddings for search; something keeps the two stores consistent at ingestion time (write path is out of findy-core's scope).
- The client makes two hops for a detail view (Upstash search, then findy-core), which is acceptable since detail is a deliberate user action.

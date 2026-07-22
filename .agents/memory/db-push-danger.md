---
name: DB push is destructive
description: Why drizzle-kit push must not be used in this project
---
Rule: never run `npm run db:push` (or `--force`) in TV Tantrum.
**Why:** shared/catalog-schema.ts does not describe all live tables; a push would drop catalog_tv_shows (302 rows), catalog_research_summaries, catalog_themes, homepage_categories, and session tables.
**How to apply:** for any schema change, add the Drizzle model for type safety, then create/alter the table with `psql $DATABASE_URL -c "..."` (e.g. CREATE TABLE IF NOT EXISTS).

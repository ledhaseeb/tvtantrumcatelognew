---
name: Cache invalidation quirks
description: How the multi-tier cache keys are structured and why invalidation must use raw prefixes
---

The `/api/tv-shows` list route in `server/index.ts` builds its own route-level cache key `tv_shows:${JSON.stringify(filters)}` instead of using `getCacheKey(CACHE_KEYS.TV_SHOWS_ALL, ...)` (`tv_shows:all:...`) used inside storage.

**Why:** Invalidating only `CACHE_KEYS.TV_SHOWS_ALL` leaves the route-level cache stale for up to 30 min; admin views read through that route.

**How to apply:** When a storage write must be reflected in list endpoints, call `invalidatePattern('tv_shows:')` (substring match) plus `TV_SHOW_BY_ID` for single-show caches, and `clearAllEnhancedCaches()` for search/homepage.

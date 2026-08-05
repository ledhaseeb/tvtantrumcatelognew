// Vercel catch-all serverless entry point.
// Using [...slug].ts (catch-all) ensures Vercel preserves the full original
// request path (e.g. /api/tv-shows, /api/admin/login) so Express can route
// correctly. A plain index.ts would collapse all paths to /api/index.
import { app } from '../server/index.js';

export default app;

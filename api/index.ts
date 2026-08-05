// Vercel serverless entry point.
// All requests are routed here via vercel.json rewrites.
// Express handles /api/* routes and falls back to serving the static
// frontend from dist/public for everything else (SPA routing).
import { app } from '../server/index.js';

export default app;

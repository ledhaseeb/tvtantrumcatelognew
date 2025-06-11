import express from "express";
import { createServer } from "http";
import { registerCatalogRoutes } from "./catalog-routes";
import path from "path";

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client/dist
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

// Register catalog API routes
registerCatalogRoutes(app);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`TV Tantrum Catalog running on http://localhost:${PORT}`);
});

export default app;
#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the built server
const { default: app } = await import('./dist/index.js').catch(async () => {
  // Fallback to direct server import if dist doesn't exist
  const serverModule = await import('./server/index.ts');
  return serverModule;
});

const port = Number(process.env.PORT) || 3000;

// Ensure health check endpoint exists
if (typeof app === 'function' || (app && typeof app.listen === 'function')) {
  const server = app.listen ? app : express().use(app);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`TV Tantrum production server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/api/health`);
  });
} else {
  console.error('Failed to start server - invalid app export');
  process.exit(1);
}
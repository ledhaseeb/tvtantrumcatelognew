#!/usr/bin/env node

// Simple Node.js starter script for Railway deployment
const { spawn } = require('child_process');

// Set production environment
process.env.NODE_ENV = 'production';

// Start the TypeScript server directly
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
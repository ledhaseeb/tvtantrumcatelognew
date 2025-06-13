// Railway deployment entry point
const { spawn } = require('child_process');

console.log('Starting TV Tantrum Catalog...');

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server process
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
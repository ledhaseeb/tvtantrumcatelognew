// Railway production entry point
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import and start the server
require('tsx/cli').main(['server/index.ts']);
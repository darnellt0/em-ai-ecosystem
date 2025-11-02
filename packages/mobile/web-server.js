#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║      Elevated Movements - Mobile App Web Server               ║
╚════════════════════════════════════════════════════════════════╝
`);

// Start the Metro bundler
console.log('Starting Metro Bundler...\n');

const expo = spawn('npx', ['expo', 'start', '--web', '--localhost'], {
  stdio: 'inherit',
  shell: true,
});

expo.on('error', (error) => {
  console.error(`Error starting Expo: ${error.message}`);
  process.exit(1);
});

expo.on('close', (code) => {
  console.log(`Expo process exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  expo.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down server...');
  expo.kill();
  process.exit(0);
});

console.log(`
📱 Mobile App Server Starting...

⏳ Please wait 15-30 seconds for the bundler to initialize.

Once ready, open your browser to:
  → http://localhost:19006

Press Ctrl+C to stop the server.
`);

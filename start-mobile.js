#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const mobileDir = path.join(__dirname, 'packages', 'mobile');

console.log(`
╔═════════════════════════════════════════════════════════════╗
║  Elevated Movements Mobile App - Development Server        ║
╚═════════════════════════════════════════════════════════════╝

Starting Expo web server...
`);

// Start the Expo web server
const expo = spawn('npm', ['run', 'web', '--', '--max-workers=1'], {
  cwd: mobileDir,
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

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down mobile app server...');
  expo.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down mobile app server...');
  expo.kill();
  process.exit(0);
});

console.log(`
📱 Mobile App is starting...

⏳ Wait 10-15 seconds for the server to fully initialize.

After initialization, you'll be able to access:
  • Web: http://localhost:19006
  • Dashboard: http://localhost:19000

Ctrl+C to stop the server
`);

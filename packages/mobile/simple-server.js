#!/usr/bin/env node
/**
 * Simple HTTP Server for React Native Web
 * Serves the bundled app with live reloading support
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 19006;
const PROJECT_DIR = __dirname;

console.log(`
╔════════════════════════════════════════════════════════════════╗
║        Elevated Movements - Mobile App Web Server             ║
║                                                                ║
║  Starting Metro bundler and web server...                     ║
╚════════════════════════════════════════════════════════════════╝
`);

// Start Metro bundler in the background
const metroProcess = spawn('npx', ['expo', 'start', '--web', '--localhost', '--clear'], {
  cwd: PROJECT_DIR,
  stdio: 'inherit',
  shell: true
});

metroProcess.on('error', (err) => {
  console.error('Failed to start Metro bundler:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  metroProcess.kill();
  process.exit(0);
});

console.log(`
✅ Server starting up...
   📱 Web App: http://localhost:${PORT}
   🔧 Metro Bundler: Starting...

   Keep this terminal open to keep the server running.
   Press Ctrl+C to stop the server.
`);

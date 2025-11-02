#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 19006;
const CERT_DIR = __dirname;

// Check if SSL certificates exist
const keyPath = path.join(CERT_DIR, 'server.key');
const certPath = path.join(CERT_DIR, 'server.crt');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('❌ SSL certificates not found!');
    console.error('   Expected: server.key and server.crt in:', CERT_DIR);
    process.exit(1);
}

// Read SSL certificates
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
    // Log requests
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Serve mobile-app.html
    if (req.url === '/' || req.url === '/mobile-app.html') {
        const filePath = path.join(CERT_DIR, 'mobile-app.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found: mobile-app.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║      Elevated Movements - Secure Mobile App Server            ║
║                      (HTTPS)                                  ║
╚════════════════════════════════════════════════════════════════╝

✅ HTTPS Server Started Successfully!

📱 Access from your phone:
   URL: https://10.0.0.249:${PORT}/mobile-app.html

💻 Access from this computer:
   URL: https://localhost:${PORT}/mobile-app.html

🔐 Uses self-signed SSL certificate (browser will warn - this is normal)

⚠️  Note: Your browser may show a security warning
   - This is expected for self-signed certificates
   - Click "Advanced" → "Proceed to site" to continue

✅ Microphone will now work because you're on HTTPS!

Press Ctrl+C to stop the server.
    `);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down HTTPS server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

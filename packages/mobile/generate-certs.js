#!/usr/bin/env node

const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Generate self-signed certificate
const attrs = [{ name: 'commonName', value: '10.0.0.249' }];
const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });

const outputDir = __dirname;
const keyPath = path.join(outputDir, 'server.key');
const certPath = path.join(outputDir, 'server.crt');

// Write key and certificate
fs.writeFileSync(keyPath, pems.private);
fs.writeFileSync(certPath, pems.cert);

console.log('✅ SSL Certificate generated!');
console.log(`   Key:  ${keyPath}`);
console.log(`   Cert: ${certPath}`);
console.log('\nYou can now run: node https-server.js');

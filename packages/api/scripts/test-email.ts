#!/usr/bin/env npx tsx

/**
 * Email Service Test Script
 * Phase 2B - Test SMTP Email Configuration
 *
 * Purpose: Verify SMTP email credentials are configured correctly by
 * sending a test email to the founder's email address.
 *
 * Usage:
 *   npm run test:email
 *   # or directly:
 *   npx tsx scripts/test-email.ts
 *
 * Required Environment Variables:
 *   SMTP_HOST - SMTP server hostname
 *   SMTP_PORT - SMTP server port
 *   SMTP_USER - SMTP username/email
 *   SMTP_PASS - SMTP password
 *   FOUNDER_DARNELL_EMAIL - Recipient email address
 *
 * Optional:
 *   SMTP_SECURE - Set to 'true' for SSL/TLS (default: false)
 *   EMAIL_FROM - Sender email address (default: SMTP_USER)
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from packages/api/.env or root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Import EmailService after env vars are loaded
import { emailService } from '../src/services/email.service';

// Required SMTP environment variables
const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

/**
 * Print header for the test output
 */
function printHeader(): void {
  console.log('\n' + '='.repeat(60));
  console.log('EMAIL SERVICE TEST');
  console.log('Phase 2B - SMTP Email Configuration');
  console.log('='.repeat(60) + '\n');
}

/**
 * Check required environment variables
 */
function checkEnvVars(): { valid: boolean; missing: string[] } {
  console.log('1. Checking environment variables...');

  const missing: string[] = [];

  for (const varName of REQUIRED_SMTP_VARS) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
      console.log(`   [ ] ${varName}: NOT SET`);
    } else {
      const masked = varName.includes('PASS') ? '****' : value;
      console.log(`   [x] ${varName}: ${masked}`);
    }
  }

  // Check recipient email
  const recipient = process.env.FOUNDER_DARNELL_EMAIL;
  if (!recipient) {
    missing.push('FOUNDER_DARNELL_EMAIL');
    console.log(`   [ ] FOUNDER_DARNELL_EMAIL: NOT SET`);
  } else {
    console.log(`   [x] FOUNDER_DARNELL_EMAIL: ${recipient}`);
  }

  console.log('');

  if (missing.length > 0) {
    console.error(`   ERROR: Missing required variables: ${missing.join(', ')}`);
    console.error('\n   Add these to your .env file:');
    missing.forEach(v => {
      console.error(`     ${v}=<value>`);
    });
    return { valid: false, missing };
  }

  console.log('   OK: All required variables set\n');
  return { valid: true, missing: [] };
}

/**
 * Check EmailService status
 */
function checkServiceStatus(): boolean {
  console.log('2. Checking EmailService status...');

  const status = emailService.getStatus();

  if (!status.configured) {
    console.error(`   ERROR: EmailService not configured`);
    console.error(`   ${status.warning || 'Unknown configuration error'}`);
    return false;
  }

  console.log(`   OK: EmailService configured with ${status.provider}\n`);
  return true;
}

/**
 * Verify SMTP connection
 */
async function verifyConnection(): Promise<boolean> {
  console.log('3. Verifying SMTP connection...');

  try {
    const connected = await emailService.verifyConnection();

    if (!connected) {
      console.error('   ERROR: Could not verify SMTP connection');
      console.error('   Check your SMTP credentials and server settings');
      return false;
    }

    console.log('   OK: SMTP connection verified\n');
    return true;
  } catch (error) {
    console.error(`   ERROR: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Send test email
 */
async function sendTestEmail(): Promise<boolean> {
  console.log('4. Sending test email...');

  const recipient = process.env.FOUNDER_DARNELL_EMAIL!;
  const subject = 'EM-AI Test Email';
  const timestamp = new Date().toISOString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>EM-AI Email Test</h2>
          </div>
          <div class="content">
            <p>This is a test email from the EM-AI Ecosystem.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
            <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
          </div>
          <div class="footer">
            <p>Elevated Movements Voice Assistant</p>
          </div>
        </div>
      </body>
    </html>
  `;

  console.log(`   To: ${recipient}`);
  console.log(`   Subject: ${subject}`);

  try {
    const result = await emailService.sendNotification(recipient, subject, html);

    if (!result.success) {
      console.error('   ERROR: Email send failed');
      return false;
    }

    console.log(`   OK: Email sent successfully`);
    console.log(`   Message ID: ${result.messageId}\n`);
    return true;
  } catch (error) {
    console.error(`   ERROR: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Print success summary
 */
function printSuccess(): void {
  console.log('='.repeat(60));
  console.log('TEST RESULT: SUCCESS');
  console.log('='.repeat(60));
  console.log('\nEmail service is working correctly!');
  console.log('\nConfiguration Summary:');
  console.log(`  - SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`  - SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`  - Recipient: ${process.env.FOUNDER_DARNELL_EMAIL}`);
  console.log('\nCheck your inbox for the test email.');
  console.log('='.repeat(60) + '\n');
}

/**
 * Print failure summary
 */
function printFailure(step: string): void {
  console.log('='.repeat(60));
  console.log('TEST RESULT: FAILED');
  console.log('='.repeat(60));
  console.log(`\nFailed at: ${step}`);
  console.log('\nTroubleshooting:');
  console.log('  1. Verify SMTP credentials are correct');
  console.log('  2. Check SMTP_HOST and SMTP_PORT settings');
  console.log('  3. Ensure SMTP_SECURE is set correctly (true for port 465)');
  console.log('  4. Check firewall/network allows SMTP connections');
  console.log('  5. Verify FOUNDER_DARNELL_EMAIL is a valid address');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  printHeader();

  // Step 1: Check environment variables
  const envCheck = checkEnvVars();
  if (!envCheck.valid) {
    printFailure('Environment variables check');
    process.exit(1);
  }

  // Step 2: Check service status
  if (!checkServiceStatus()) {
    printFailure('EmailService status check');
    process.exit(1);
  }

  // Step 3: Verify SMTP connection
  const connected = await verifyConnection();
  if (!connected) {
    printFailure('SMTP connection verification');
    process.exit(1);
  }

  // Step 4: Send test email
  const sent = await sendTestEmail();
  if (!sent) {
    printFailure('Sending test email');
    process.exit(1);
  }

  // Success!
  printSuccess();
  process.exit(0);
}

// Run if executed directly
main();

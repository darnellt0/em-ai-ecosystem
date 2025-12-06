#!/usr/bin/env npx tsx

/**
 * Google Calendar Integration Test Script
 * Phase 2B - Issue 1: Setup Google Calendar Credentials
 *
 * Purpose: Verify Google Calendar credentials are configured correctly by
 * listing the next 5-10 upcoming events from the configured calendar.
 *
 * Usage:
 *   npm run test:calendar
 *   # or directly:
 *   npx tsx scripts/test-google-calendar.ts
 *
 * Required Environment Variables:
 *   GOOGLE_CALENDAR_ID - Calendar ID to query (e.g., 'primary' or your email)
 *
 * Required Files:
 *   packages/api/config/google-credentials.json - Service account credentials
 *
 * Setup Instructions:
 *   1. Go to Google Cloud Console (https://console.cloud.google.com)
 *   2. Create or select a project
 *   3. Enable the Google Calendar API
 *   4. Create a Service Account and download the JSON key
 *   5. Place the JSON key at: packages/api/config/google-credentials.json
 *   6. Share your calendar with the service account email (found in the JSON)
 *   7. Set GOOGLE_CALENDAR_ID in your .env file
 */

import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const CREDENTIALS_PATH = path.join(__dirname, '..', 'packages', 'api', 'config', 'google-credentials.json');
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const MAX_EVENTS = 10;
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  status: string;
}

/**
 * Print header for the test output
 */
function printHeader(): void {
  console.log('\n' + '='.repeat(70));
  console.log('GOOGLE CALENDAR INTEGRATION TEST');
  console.log('Phase 2B - Issue 1: Setup Google Calendar Credentials');
  console.log('='.repeat(70) + '\n');
}

/**
 * Check if credentials file exists
 */
function checkCredentialsFile(): boolean {
  console.log('1. Checking credentials file...');
  console.log(`   Path: ${CREDENTIALS_PATH}`);

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('\n   ERROR: Credentials file not found!');
    console.error('   Please place your Google service account JSON at:');
    console.error(`   ${CREDENTIALS_PATH}`);
    console.error('\n   See PHASE_2B_IMPLEMENTATION_GUIDE.md for setup instructions.\n');
    return false;
  }

  console.log('   OK: Credentials file exists\n');
  return true;
}

/**
 * Validate credentials file structure
 */
function validateCredentials(): { valid: boolean; email?: string } {
  console.log('2. Validating credentials structure...');

  try {
    const credentialsContent = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsContent);

    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      console.error(`   ERROR: Missing required fields: ${missingFields.join(', ')}`);
      return { valid: false };
    }

    if (credentials.type !== 'service_account') {
      console.error(`   ERROR: Expected type 'service_account', got '${credentials.type}'`);
      return { valid: false };
    }

    console.log(`   OK: Valid service account credentials`);
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Service Account: ${credentials.client_email}\n`);

    return { valid: true, email: credentials.client_email };
  } catch (error) {
    console.error(`   ERROR: Failed to parse credentials file: ${(error as Error).message}`);
    return { valid: false };
  }
}

/**
 * Initialize the Google Calendar client
 */
async function initializeCalendarClient(): Promise<ReturnType<typeof google.calendar> | null> {
  console.log('3. Initializing Google Calendar client...');

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: 'v3', auth });
    console.log('   OK: Calendar client initialized\n');
    return calendar;
  } catch (error) {
    console.error(`   ERROR: Failed to initialize client: ${(error as Error).message}`);
    return null;
  }
}

/**
 * List upcoming events from the calendar
 */
async function listUpcomingEvents(
  calendar: ReturnType<typeof google.calendar>
): Promise<CalendarEvent[]> {
  console.log('4. Fetching upcoming events...');
  console.log(`   Calendar ID: ${CALENDAR_ID}`);
  console.log(`   Max events: ${MAX_EVENTS}`);

  try {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
      maxResults: MAX_EVENTS,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`   OK: Retrieved ${events.length} events\n`);

    return events.map(event => ({
      id: event.id || 'unknown',
      summary: event.summary || '(No title)',
      start: event.start?.dateTime || event.start?.date || 'unknown',
      end: event.end?.dateTime || event.end?.date || 'unknown',
      status: event.status || 'unknown',
    }));
  } catch (error: any) {
    if (error.code === 404) {
      console.error(`   ERROR: Calendar not found. Check that GOOGLE_CALENDAR_ID is correct.`);
      console.error(`   Current value: ${CALENDAR_ID}`);
    } else if (error.code === 403) {
      console.error(`   ERROR: Access denied. Make sure you've shared the calendar`);
      console.error(`   with the service account email.`);
    } else {
      console.error(`   ERROR: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Display the events in a formatted table
 */
function displayEvents(events: CalendarEvent[]): void {
  console.log('5. Upcoming Events:');
  console.log('-'.repeat(70));

  if (events.length === 0) {
    console.log('   No upcoming events found in the next month.');
    console.log('-'.repeat(70));
    return;
  }

  events.forEach((event, index) => {
    const startDate = new Date(event.start);
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    console.log(`   ${index + 1}. ${event.summary}`);
    console.log(`      Date: ${formattedDate} at ${formattedTime}`);
    console.log(`      ID: ${event.id}`);
    console.log('');
  });

  console.log('-'.repeat(70));
}

/**
 * Print success summary
 */
function printSuccess(serviceAccountEmail: string): void {
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULT: SUCCESS');
  console.log('='.repeat(70));
  console.log('\nGoogle Calendar integration is working correctly!');
  console.log('\nConfiguration Summary:');
  console.log(`  - Credentials: ${CREDENTIALS_PATH}`);
  console.log(`  - Calendar ID: ${CALENDAR_ID}`);
  console.log(`  - Service Account: ${serviceAccountEmail}`);
  console.log('\nNext Steps:');
  console.log('  1. Proceed to Issue 2: Implement Google Calendar Client');
  console.log('  2. Wire the CalendarService into your agents');
  console.log('  3. Test event creation and deletion');
  console.log('='.repeat(70) + '\n');
}

/**
 * Print failure summary
 */
function printFailure(step: string, error: Error): void {
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULT: FAILED');
  console.log('='.repeat(70));
  console.log(`\nFailed at: ${step}`);
  console.log(`Error: ${error.message}`);
  console.log('\nTroubleshooting:');
  console.log('  1. Verify google-credentials.json is in packages/api/config/');
  console.log('  2. Check that Google Calendar API is enabled in Cloud Console');
  console.log('  3. Ensure calendar is shared with the service account email');
  console.log('  4. Verify GOOGLE_CALENDAR_ID is set correctly in .env');
  console.log('\nSee PHASE_2B_IMPLEMENTATION_GUIDE.md for detailed setup instructions.');
  console.log('='.repeat(70) + '\n');
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  printHeader();

  let serviceAccountEmail = '';

  try {
    // Step 1: Check credentials file exists
    if (!checkCredentialsFile()) {
      process.exit(1);
    }

    // Step 2: Validate credentials structure
    const validation = validateCredentials();
    if (!validation.valid) {
      process.exit(1);
    }
    serviceAccountEmail = validation.email || '';

    // Step 3: Initialize calendar client
    const calendar = await initializeCalendarClient();
    if (!calendar) {
      process.exit(1);
    }

    // Step 4: List upcoming events
    const events = await listUpcomingEvents(calendar);

    // Step 5: Display events
    displayEvents(events);

    // Success!
    printSuccess(serviceAccountEmail);
    process.exit(0);
  } catch (error) {
    printFailure('Calendar API call', error as Error);
    process.exit(1);
  }
}

// Run if executed directly
main();

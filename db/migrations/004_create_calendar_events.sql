-- Migration: Create calendar_events table
-- Date: 2025-11-06
-- Description: Track calendar events created through the voice API

CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  founder_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  buffer_minutes INT DEFAULT 0,
  attendees JSONB DEFAULT '[]'::jsonb,
  conflicts JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  google_calendar_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_founder ON calendar_events(founder_email);
CREATE INDEX IF NOT EXISTS idx_calendar_event_id ON calendar_events(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(status);

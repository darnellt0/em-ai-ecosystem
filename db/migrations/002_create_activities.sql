-- Migration: Create activities table
-- Date: 2025-11-06
-- Description: Activity tracking for pause sessions, deep work, energy levels

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  duration_minutes INT,
  energy_level VARCHAR(20),
  productivity_score INT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_timestamp TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_founder ON activities(founder_email);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_energy ON activities(energy_level);

-- Insert sample activities
INSERT INTO activities (founder_email, activity_type, duration_minutes, energy_level, notes) VALUES
  ('darnell@elevatedmovements.com', 'deep_work', 120, 'high', 'Completed Q4 planning in deep focus session'),
  ('darnell@elevatedmovements.com', 'pause', 5, 'medium', 'Quick meditation break'),
  ('shria@elevatedmovements.com', 'deep_work', 90, 'high', 'Grant research session'),
  ('shria@elevatedmovements.com', 'meeting', 30, 'medium', 'Team standup')
ON CONFLICT DO NOTHING;

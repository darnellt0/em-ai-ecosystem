-- Migration: Create notifications table
-- Date: 2025-11-06
-- Description: Track all notifications sent (email, Slack, etc)

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  subject VARCHAR(500),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_founder ON notifications(founder_email);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

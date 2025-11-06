-- Migration: Create tasks table
-- Date: 2025-11-06
-- Description: Core task management for founders

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(100) PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  completion_note TEXT,
  next_task_id VARCHAR(100),
  context JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Task history/audit log
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  change_details JSONB,
  changed_by VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_founder_email ON tasks(founder_email);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_timestamp ON task_history(timestamp);

-- Insert some sample tasks for testing
INSERT INTO tasks (id, founder_email, title, description, status, priority, due_date) VALUES
  ('task_sample_001', 'darnell@elevatedmovements.com', 'Review Q4 Planning Document', 'Review and finalize Q4 strategic planning document', 'pending', 'high', CURRENT_TIMESTAMP + INTERVAL '2 days'),
  ('task_sample_002', 'darnell@elevatedmovements.com', 'Budget Approval Meeting Prep', 'Prepare materials for budget approval meeting', 'pending', 'medium', CURRENT_TIMESTAMP + INTERVAL '1 day'),
  ('task_sample_003', 'shria@elevatedmovements.com', 'Grant Research - Q1 2026', 'Research available grants for Q1 2026', 'pending', 'medium', CURRENT_TIMESTAMP + INTERVAL '5 days'),
  ('task_sample_004', 'shria@elevatedmovements.com', 'Team 1-on-1 Schedule', 'Schedule 1-on-1s with all team members', 'pending', 'low', CURRENT_TIMESTAMP + INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

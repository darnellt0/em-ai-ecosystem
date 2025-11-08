-- Create tables for Elevated Movements AI Ecosystem

-- Agent management tables
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  success_rate DECIMAL(5,2),
  execution_time INTEGER
);

CREATE TABLE IF NOT EXISTS executions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  status VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER,
  error TEXT
);

CREATE TABLE IF NOT EXISTS costs (
  id SERIAL PRIMARY KEY,
  service VARCHAR(100),
  agent VARCHAR(100),
  cost DECIMAL(10,6),
  date DATE,
  tokens_used INTEGER
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP,
  level VARCHAR(20),
  agent VARCHAR(100),
  message TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  content TEXT,
  founder VARCHAR(50),
  status VARCHAR(50),
  submitted_at TIMESTAMP,
  decided_at TIMESTAMP,
  decision_reason TEXT
);

-- Task management tables (used by database.service.ts)
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  completion_note TEXT,
  next_task_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  change_details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  duration_minutes INT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_executions_agent ON executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_costs_date ON costs(date);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_founder_email ON tasks(founder_email);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_founder ON activities(founder_email);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

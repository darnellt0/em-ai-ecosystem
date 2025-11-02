-- Create tables for Elevated Movements AI Ecosystem

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

-- Create indexes
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_executions_agent ON executions(agent_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_approvals_status ON approvals(status);

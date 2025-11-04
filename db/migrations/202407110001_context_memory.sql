CREATE TABLE IF NOT EXISTS long_term_memory (
  id UUID PRIMARY KEY,
  founder TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_long_term_memory_founder_key
  ON long_term_memory (founder, key, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  founder TEXT NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('new', 'in_progress', 'blocked', 'done')),
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_founder ON tasks (founder);
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks (state);

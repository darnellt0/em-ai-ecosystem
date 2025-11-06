-- Migration: Multi-user and Team Support
-- Date: 2025-11-06
-- Description: Add multi-tenancy, RBAC, and team collaboration features

-- Users table (extends founder concept)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  organization_id VARCHAR(100),
  calendar_id VARCHAR(255),
  slack_user_id VARCHAR(100),
  preferences JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations/Teams table
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB DEFAULT '[]'::jsonb,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(organization_id, user_id)
);

-- Shared calendars
CREATE TABLE IF NOT EXISTS shared_calendars (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id VARCHAR(100) NOT NULL,
  visibility VARCHAR(50) DEFAULT 'team',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys/tokens for multi-user access
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  scopes JSONB DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Add foreign key to users table
ALTER TABLE users
  ADD CONSTRAINT fk_users_organization
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;

-- Insert default organization and users
INSERT INTO organizations (id, name, slug, plan) VALUES
  ('org_elevated_movements', 'Elevated Movements', 'elevated-movements', 'premium')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, role, organization_id) VALUES
  ('user_darnell', 'darnell@elevatedmovements.com', 'Darnell', 'admin', 'org_elevated_movements'),
  ('user_shria', 'shria@elevatedmovements.com', 'Shria', 'admin', 'org_elevated_movements')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (organization_id, user_id, role, permissions) VALUES
  ('org_elevated_movements', 'user_darnell', 'owner', '["all"]'::jsonb),
  ('org_elevated_movements', 'user_shria', 'owner', '["all"]'::jsonb)
ON CONFLICT (organization_id, user_id) DO NOTHING;

# 🚀 Multi-Agent Production Deployment Plan
## Elevated Movements AI Ecosystem - Path to Production

**Goal**: Deliver a working, production-ready system where users can sign up, log in, and access all features.

**Strategy**: 4 parallel verticals executed by independent Claude Code agents, converging into a complete system.

**Estimated Total Time**: 3-4 hours (all verticals running in parallel)

---

## 📋 Pre-Execution Requirements (5 minutes)

Before starting the agents, establish these shared contracts:

### Database Schema Contract
```sql
-- users table structure (agreed upon by Vertical 1 & 2)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### API Response Contract
```typescript
// Signup/Login response format
{
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  },
  token: string;
  expires_at: string;
}
```

### Environment Variables Contract
```bash
# Required for all verticals
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/em_ecosystem
JWT_SECRET=<generated-secret>
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10
```

---

## 🔷 VERTICAL 1: Authentication Backend
**Agent Focus**: API Endpoints & Business Logic
**Estimated Time**: 2-3 hours
**Priority**: CRITICAL PATH
**Dependencies**: Database schema contract (above)

### Tasks

#### 1.1 Create Authentication Service
**File**: `packages/api/src/services/auth.service.ts`

**Implement**:
```typescript
class AuthService {
  async signup(name: string, email: string, password: string): Promise<AuthResult>
  async login(email: string, password: string): Promise<AuthResult>
  async logout(token: string): Promise<void>
  async refreshToken(oldToken: string): Promise<AuthResult>
  async validateToken(token: string): Promise<User>
  async hashPassword(password: string): Promise<string>
  async verifyPassword(password: string, hash: string): Promise<boolean>
}
```

**Requirements**:
- Use bcrypt for password hashing (10 rounds)
- Use jsonwebtoken for JWT generation
- Token expiration: 7 days
- Email validation (must be valid email format)
- Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
- Check for duplicate emails on signup
- SQL injection prevention (use parameterized queries)

#### 1.2 Create Authentication Router
**File**: `packages/api/src/auth/auth.router.ts`

**Endpoints to Implement**:
```typescript
POST /api/auth/signup
  Body: { name: string, email: string, password: string }
  Response: { user, token, expires_at }
  Status: 201 Created | 400 Bad Request | 409 Conflict

POST /api/auth/login
  Body: { email: string, password: string }
  Response: { user, token, expires_at }
  Status: 200 OK | 401 Unauthorized | 429 Too Many Requests

POST /api/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: true }
  Status: 200 OK | 401 Unauthorized

POST /api/auth/refresh
  Headers: Authorization: Bearer <token>
  Response: { user, token, expires_at }
  Status: 200 OK | 401 Unauthorized
```

**Security Requirements**:
- Rate limiting: 5 requests per minute per IP for login/signup
- Input validation using Zod schemas
- CORS headers properly configured
- Sanitize all inputs
- Log all authentication attempts (success/failure)

#### 1.3 Create Authentication Middleware
**File**: `packages/api/src/middleware/auth.middleware.ts`

**Implement**:
```typescript
export const requireAuth = async (req, res, next) => {
  // Extract Bearer token
  // Validate token with AuthService
  // Attach user to req.user
  // Call next() or return 401
}

export const optionalAuth = async (req, res, next) => {
  // Same as requireAuth but don't fail if no token
}
```

#### 1.4 Update Main Server
**File**: `packages/api/src/index.ts`

**Changes**:
```typescript
import authRouter from './auth/auth.router';

// Add auth routes
app.use('/api/auth', authRouter);

// Apply auth middleware to protected routes
app.use('/api/voice', requireAuth, voiceRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
```

#### 1.5 Create Tests
**File**: `packages/api/tests/auth.test.ts`

**Test Cases** (minimum 15 tests):
- Signup: valid user creation
- Signup: duplicate email rejection
- Signup: invalid email format
- Signup: weak password rejection
- Login: successful authentication
- Login: wrong password
- Login: non-existent user
- Login: rate limiting enforcement
- Logout: successful token invalidation
- Refresh: successful token refresh
- Refresh: expired token rejection
- Middleware: valid token access
- Middleware: invalid token rejection
- Middleware: missing token rejection
- Middleware: expired token rejection

### Deliverables
- ✅ AuthService with complete implementation
- ✅ Auth router with 4 endpoints
- ✅ Auth middleware (requireAuth, optionalAuth)
- ✅ Integration with main server
- ✅ 15+ passing tests
- ✅ Error handling for all edge cases
- ✅ Security measures (rate limiting, validation, sanitization)

### Success Criteria
```bash
# All these should work:
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
# → 201 Created, returns user + token

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
# → 200 OK, returns user + token

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
# → 200 OK

# Tests pass:
npm run test:auth
# → 15/15 tests passing
```

---

## 🔶 VERTICAL 2: Database Schema & Initialization
**Agent Focus**: Database Setup & Migrations
**Estimated Time**: 1-2 hours
**Priority**: CRITICAL PATH
**Dependencies**: Database schema contract (above)

### Tasks

#### 2.1 Create Database Schema Migration
**File**: `packages/api/migrations/001_create_auth_tables.sql`

**Implement**:
```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 Create Database Service
**File**: `packages/api/src/services/database.service.ts`

**Implement**:
```typescript
import { Pool } from 'pg';

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query(text: string, params?: any[]): Promise<any>
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>
  async healthCheck(): Promise<boolean>
  async runMigrations(): Promise<void>
  async close(): Promise<void>
}
```

**Requirements**:
- Connection pooling configured
- Transaction support
- Error handling and retry logic
- Query logging in development
- Migration runner

#### 2.3 Create User Repository
**File**: `packages/api/src/repositories/user.repository.ts`

**Implement**:
```typescript
class UserRepository {
  async create(name: string, email: string, passwordHash: string): Promise<User>
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async update(id: string, updates: Partial<User>): Promise<User>
  async updateLastLogin(id: string): Promise<void>
  async delete(id: string): Promise<void>
  async list(limit: number, offset: number): Promise<User[]>
}
```

#### 2.4 Create Session Repository
**File**: `packages/api/src/repositories/session.repository.ts`

**Implement**:
```typescript
class SessionRepository {
  async create(userId: string, token: string, expiresAt: Date, metadata?: any): Promise<Session>
  async findByToken(token: string): Promise<Session | null>
  async updateLastUsed(token: string): Promise<void>
  async deleteByToken(token: string): Promise<void>
  async deleteExpired(): Promise<number>
  async deleteByUserId(userId: string): Promise<number>
}
```

#### 2.5 Create Database Initialization Script
**File**: `packages/api/scripts/init-db.ts`

**Implement**:
```typescript
// Script to:
// 1. Check database connection
// 2. Run migrations
// 3. Create indexes
// 4. Seed initial data (if in development)
// 5. Verify schema integrity
```

#### 2.6 Create Seed Data (Development Only)
**File**: `packages/api/seeds/001_test_users.sql`

**Implement**:
```sql
-- Create test users for development
-- Password for all: Test1234
INSERT INTO users (name, email, password_hash) VALUES
  ('Darnell', 'darnell@elevatedmovements.com', '<bcrypt_hash>'),
  ('Shria', 'shria@elevatedmovements.com', '<bcrypt_hash>'),
  ('Test User', 'test@example.com', '<bcrypt_hash>');
```

#### 2.7 Update Docker Compose
**File**: `docker-compose.yml`

**Add/Update**:
```yaml
services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: em_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: em_ecosystem
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/api/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U em_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Deliverables
- ✅ SQL migration files for auth tables
- ✅ DatabaseService with connection pooling
- ✅ UserRepository with CRUD operations
- ✅ SessionRepository with token management
- ✅ Database initialization script
- ✅ Seed data for development
- ✅ Updated Docker configuration

### Success Criteria
```bash
# Database can be initialized:
npm run db:init
# → All migrations run successfully

# Tables exist:
psql -d em_ecosystem -c "\dt"
# → users, sessions, agents, executions, etc.

# Can query users:
psql -d em_ecosystem -c "SELECT * FROM users;"
# → Returns test users (in dev mode)

# Health check passes:
curl http://localhost:3000/api/health
# → database: "connected"
```

---

## 🔷 VERTICAL 3: Deployment & Infrastructure
**Agent Focus**: Production Deployment Setup
**Estimated Time**: 2-3 hours
**Priority**: HIGH
**Dependencies**: None (can start immediately)

### Tasks

#### 3.1 Environment Configuration
**File**: `packages/api/.env.production`

**Create Template**:
```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://your-domain.com/api

# Database
DATABASE_URL=postgresql://user:password@host:5432/em_ecosystem
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Authentication
JWT_SECRET=<generate-with-openssl>
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10

# Redis
REDIS_URL=redis://redis:6379
REDIS_TTL=3600

# External APIs
OPENAI_API_KEY=${OPENAI_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Founders
FOUNDER_DARNELL_EMAIL=darnell@elevatedmovements.com
FOUNDER_SHRIA_EMAIL=shria@elevatedmovements.com

# Security
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://em-ai-mobile.vercel.app

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=${SENTRY_DSN}
```

#### 3.2 Create Startup Script
**File**: `packages/api/scripts/start-production.sh`

**Implement**:
```bash
#!/bin/bash
set -e

echo "🚀 Starting Elevated Movements AI Ecosystem..."

# Check environment
if [ "$NODE_ENV" != "production" ]; then
  echo "❌ NODE_ENV must be 'production'"
  exit 1
fi

# Check required env vars
required_vars=("DATABASE_URL" "JWT_SECRET" "PORT")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

# Wait for database
echo "⏳ Waiting for database..."
until pg_isready -h $DB_HOST -p 5432 -U $DB_USER; do
  sleep 2
done
echo "✅ Database ready"

# Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Clean expired sessions
echo "🧹 Cleaning expired sessions..."
npm run db:cleanup

# Build application
echo "🔨 Building application..."
npm run build

# Start server
echo "✅ Starting server on port $PORT..."
node dist/index.js
```

#### 3.3 Create Docker Production Configuration
**File**: `Dockerfile.production`

**Implement**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/core/package*.json ./packages/core/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY packages/ ./packages/
COPY tsconfig.json ./

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/package*.json ./

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### 3.4 Create Production Docker Compose
**File**: `docker-compose.production.yml`

**Implement**:
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.production
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://em_user:${DB_PASSWORD}@database:5432/em_ecosystem
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: em_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: em_ecosystem
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/api/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U em_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:
```

#### 3.5 Configure Reverse Proxy
**File**: `Caddyfile`

**Implement**:
```caddy
{
  email admin@elevatedmovements.com
}

# Production domain
your-domain.com {
  # API proxy
  reverse_proxy /api/* api:3000
  reverse_proxy /health api:3000

  # Security headers
  header {
    Strict-Transport-Security "max-age=31536000;"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
  }

  # Rate limiting
  rate_limit {
    zone api {
      key {remote_host}
      events 100
      window 1m
    }
  }

  # Logging
  log {
    output file /var/log/caddy/access.log
    format json
  }
}
```

#### 3.6 Create Deployment Scripts
**File**: `scripts/deploy.sh`

**Implement**:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Elevated Movements AI Ecosystem..."

# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.production.yml build

# Stop old containers
docker-compose -f docker-compose.production.yml down

# Start new containers
docker-compose -f docker-compose.production.yml up -d

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
curl -f http://localhost:3000/health || exit 1

echo "✅ Deployment successful!"
echo "📊 Check status: docker-compose -f docker-compose.production.yml ps"
echo "📋 Check logs: docker-compose -f docker-compose.production.yml logs -f"
```

#### 3.7 Create Monitoring Script
**File**: `scripts/monitor.sh`

**Implement**:
```bash
#!/bin/bash

# Health check script
# Run this in cron: */5 * * * * /path/to/monitor.sh

API_URL="http://localhost:3000/health"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -ne 200 ]; then
  # Alert via Slack
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"🚨 API Health Check Failed: HTTP $response\"}"

  # Restart service
  docker-compose -f docker-compose.production.yml restart api
fi
```

#### 3.8 Configure Alternative Tunneling (ngrok replacement)

**Option A: Cloudflare Tunnel**
**File**: `scripts/setup-cloudflare-tunnel.sh`

```bash
#!/bin/bash

# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create em-ai-ecosystem

# Configure tunnel
cat > ~/.cloudflared/config.yml <<EOF
tunnel: em-ai-ecosystem
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.elevatedmovements.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Install as service
cloudflared service install

# Start tunnel
systemctl start cloudflared
systemctl enable cloudflared
```

**Option B: Paid ngrok with Static Domain**
**File**: `scripts/setup-ngrok-production.sh`

```bash
#!/bin/bash

# Requires ngrok paid plan
ngrok config add-authtoken ${NGROK_AUTH_TOKEN}

# Create static domain: em-ai-ecosystem.ngrok.app
ngrok http 3000 --domain=em-ai-ecosystem.ngrok.app --log=stdout
```

### Deliverables
- ✅ Production environment configuration
- ✅ Startup scripts with health checks
- ✅ Production Dockerfile (multi-stage build)
- ✅ Production Docker Compose configuration
- ✅ Reverse proxy (Caddy) with HTTPS
- ✅ Deployment automation scripts
- ✅ Monitoring and alerting script
- ✅ Alternative tunneling setup (Cloudflare or paid ngrok)

### Success Criteria
```bash
# Build production image:
docker-compose -f docker-compose.production.yml build
# → Build succeeds, optimized image created

# Deploy to production:
./scripts/deploy.sh
# → All services start, health checks pass

# System is accessible:
curl https://your-domain.com/health
# → 200 OK, system healthy

# Can authenticate:
curl -X POST https://your-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Test","email":"test@prod.com","password":"Test1234"}'
# → 201 Created

# Monitoring works:
./scripts/monitor.sh
# → Exits 0 if healthy
```

---

## 🔶 VERTICAL 4: Integration Testing & Validation
**Agent Focus**: End-to-End Testing & Quality Assurance
**Estimated Time**: 2-3 hours
**Priority**: HIGH
**Dependencies**: Verticals 1, 2, 3 completed

### Tasks

#### 4.1 Create Integration Test Suite
**File**: `packages/api/tests/integration/auth-flow.test.ts`

**Implement**:
```typescript
describe('Authentication Flow - End to End', () => {
  // Test complete user journey:

  test('User can sign up successfully')
  test('User cannot sign up with duplicate email')
  test('User can log in with correct credentials')
  test('User cannot log in with wrong password')
  test('User can access protected endpoints with valid token')
  test('User cannot access protected endpoints without token')
  test('User can refresh token before expiration')
  test('User can log out and invalidate token')
  test('Expired tokens are rejected')
  test('Rate limiting prevents brute force')
});
```

#### 4.2 Create API Integration Tests
**File**: `packages/api/tests/integration/api-endpoints.test.ts`

**Test All Endpoints**:
```typescript
describe('Protected API Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get token
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test', email: 'test@test.com', password: 'Test1234' });
    authToken = response.body.token;
  });

  test('GET /api/dashboard requires authentication')
  test('POST /api/voice/scheduler/block requires authentication')
  test('GET /api/agents/status requires authentication')
  test('Authenticated requests succeed')
  test('Response formats match API contract')
});
```

#### 4.3 Create Load Testing Suite
**File**: `packages/api/tests/load/auth-load.test.ts`

**Use k6 or Artillery**:
```javascript
// k6 load test
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '30s',
};

export default function () {
  // Simulate signup
  const signupResponse = http.post('http://localhost:3000/api/auth/signup',
    JSON.stringify({
      name: 'Load Test User',
      email: `test-${__VU}-${Date.now()}@example.com`,
      password: 'Test1234'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(signupResponse, {
    'signup status is 201': (r) => r.status === 201,
    'signup returns token': (r) => JSON.parse(r.body).token !== undefined,
  });

  sleep(1);
}
```

#### 4.4 Create Security Testing Script
**File**: `packages/api/tests/security/vulnerabilities.test.ts`

**Test For**:
```typescript
describe('Security Vulnerabilities', () => {
  test('SQL injection attempts are blocked')
  test('XSS attempts are sanitized')
  test('CSRF protection is active')
  test('Rate limiting prevents brute force')
  test('Weak passwords are rejected')
  test('Invalid JWTs are rejected')
  test('Expired tokens cannot be used')
  test('CORS only allows configured origins')
  test('Sensitive data not leaked in errors')
});
```

#### 4.5 Create Frontend-Backend Integration Test
**File**: `packages/mobile/tests/auth-integration.test.ts`

**Simulate Frontend Flow**:
```typescript
describe('Frontend-Backend Integration', () => {
  test('Mobile app can sign up user')
  test('Mobile app can log in user')
  test('Mobile app can call protected endpoints')
  test('Mobile app handles token expiration')
  test('Mobile app handles network errors')
  test('Mobile app persists auth state')
});
```

#### 4.6 Create Database Integrity Tests
**File**: `packages/api/tests/database/integrity.test.ts`

**Verify**:
```typescript
describe('Database Integrity', () => {
  test('All migrations have run')
  test('All required tables exist')
  test('All foreign keys are valid')
  test('All indexes exist')
  test('Database constraints work (unique, not null)')
  test('Cascade deletes work correctly')
  test('Triggers work (updated_at auto-update)')
});
```

#### 4.7 Create Automated Smoke Tests
**File**: `scripts/smoke-test.sh`

**Quick Production Verification**:
```bash
#!/bin/bash

API_URL="${1:-http://localhost:3000}"
echo "🧪 Running smoke tests against $API_URL"

# Test 1: Health check
echo "Test 1: Health check..."
curl -f $API_URL/health || exit 1

# Test 2: Signup new user
echo "Test 2: User signup..."
TOKEN=$(curl -s -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Test\",\"email\":\"smoke-$(date +%s)@test.com\",\"password\":\"Test1234\"}" \
  | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "❌ Signup failed"
  exit 1
fi
echo "✅ Signup successful"

# Test 3: Access protected endpoint
echo "Test 3: Protected endpoint access..."
curl -f -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/dashboard || exit 1
echo "✅ Protected endpoint accessible"

# Test 4: Logout
echo "Test 4: Logout..."
curl -f -X POST -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/auth/logout || exit 1
echo "✅ Logout successful"

echo ""
echo "✅ All smoke tests passed!"
```

#### 4.8 Create Performance Benchmarks
**File**: `packages/api/tests/performance/benchmarks.test.ts`

**Measure**:
```typescript
describe('Performance Benchmarks', () => {
  test('Health check responds in < 50ms')
  test('Login completes in < 200ms')
  test('Signup completes in < 500ms (bcrypt hashing)')
  test('Protected endpoint responds in < 100ms')
  test('Database queries complete in < 50ms')
  test('System handles 100 concurrent requests')
});
```

#### 4.9 Create Validation Report Generator
**File**: `scripts/generate-validation-report.sh`

**Generate Comprehensive Report**:
```bash
#!/bin/bash

echo "# Production Validation Report" > validation-report.md
echo "Generated: $(date)" >> validation-report.md
echo "" >> validation-report.md

# Run all tests and capture results
npm run test:integration 2>&1 | tee -a validation-report.md
npm run test:security 2>&1 | tee -a validation-report.md
npm run test:load 2>&1 | tee -a validation-report.md

# Check health
echo "## Health Status" >> validation-report.md
curl -s http://localhost:3000/health | jq >> validation-report.md

# Check database
echo "## Database Status" >> validation-report.md
npm run db:health >> validation-report.md

# Summary
echo "## Summary" >> validation-report.md
echo "✅ All validation checks complete" >> validation-report.md

cat validation-report.md
```

### Deliverables
- ✅ Integration test suite (15+ tests)
- ✅ API endpoint tests (20+ tests)
- ✅ Load testing configuration
- ✅ Security vulnerability tests (10+ tests)
- ✅ Frontend-backend integration tests
- ✅ Database integrity tests
- ✅ Automated smoke test script
- ✅ Performance benchmarks
- ✅ Validation report generator

### Success Criteria
```bash
# All integration tests pass:
npm run test:integration
# → 50+ tests passing

# Security tests pass:
npm run test:security
# → 10+ security tests passing

# Load test succeeds:
npm run test:load
# → System handles 50 concurrent users
# → 95th percentile response time < 500ms
# → 0% error rate

# Smoke tests pass:
./scripts/smoke-test.sh http://localhost:3000
# → ✅ All smoke tests passed!

# Validation report generated:
./scripts/generate-validation-report.sh
# → Comprehensive report with all test results
```

---

## 🎯 Convergence & Final Validation

### Pre-Production Checklist

After all 4 verticals complete, validate convergence:

```bash
# 1. All services running
docker-compose -f docker-compose.production.yml ps
# → All services "healthy"

# 2. Database initialized
npm run db:health
# → All tables exist, migrations complete

# 3. Authentication works
./scripts/smoke-test.sh
# → All tests pass

# 4. Load testing passes
npm run test:load
# → System stable under load

# 5. Security validated
npm run test:security
# → No vulnerabilities found

# 6. Frontend connects
# → Open https://em-ai-mobile.vercel.app
# → Sign up new user → Success
# → Log in → Success
# → Access dashboard → Success
```

### Production Deployment Steps

```bash
# Step 1: Set environment variables
export DATABASE_URL="postgresql://..."
export JWT_SECRET="$(openssl rand -base64 32)"
export NODE_ENV="production"

# Step 2: Deploy infrastructure
./scripts/deploy.sh

# Step 3: Run smoke tests
./scripts/smoke-test.sh https://your-domain.com

# Step 4: Update frontend environment
# Update Vercel env: API_URL=https://your-domain.com/api

# Step 5: Monitor
./scripts/monitor.sh

# Step 6: Validate end-to-end
# 1. Visit https://em-ai-mobile.vercel.app
# 2. Sign up new user
# 3. Log in
# 4. Test voice commands
# 5. Verify dashboard data
```

---

## 📊 Timeline & Resource Allocation

### Parallel Execution (3-4 hours total)

```
Hour 0:
├─ Agent 1: Start Vertical 1 (Auth Backend)
├─ Agent 2: Start Vertical 2 (Database)
├─ Agent 3: Start Vertical 3 (Deployment)
└─ Agent 4: Prepare test infrastructure

Hour 1-2:
├─ Agent 1: Implementing auth service + router
├─ Agent 2: Creating schema + repositories
├─ Agent 3: Configuring Docker + deployment
└─ Agent 4: Writing test suites

Hour 2-3:
├─ Agent 1: Testing + debugging auth
├─ Agent 2: Running migrations + seeding
├─ Agent 3: Deploying infrastructure
└─ Agent 4: Running integration tests

Hour 3-4:
├─ All: Convergence testing
├─ All: Bug fixes + refinements
├─ All: Production validation
└─ All: Documentation + handoff

Hour 4+:
└─ PRODUCTION READY ✅
```

---

## 🚀 Execution Command

Once this plan is approved, execute with:

```bash
# Launch all 4 agents in parallel
claude-code agent launch --vertical=1 --file=MULTI_AGENT_DEPLOYMENT_PLAN.md
claude-code agent launch --vertical=2 --file=MULTI_AGENT_DEPLOYMENT_PLAN.md
claude-code agent launch --vertical=3 --file=MULTI_AGENT_DEPLOYMENT_PLAN.md
claude-code agent launch --vertical=4 --file=MULTI_AGENT_DEPLOYMENT_PLAN.md

# Monitor progress
claude-code agent status --all

# Converge results
claude-code agent converge --output=PRODUCTION_READY.md
```

---

## 📞 Communication Protocol

Agents will coordinate via:

1. **Shared contracts** (defined above)
2. **Git branches** (vertical-1, vertical-2, vertical-3, vertical-4)
3. **Status updates** (every 30 minutes)
4. **Convergence meeting** (after Hour 3)

---

## ✅ Definition of Done

System is production-ready when:

- ✅ Users can sign up via frontend
- ✅ Users can log in via frontend
- ✅ Protected API endpoints require auth
- ✅ All tests pass (integration, security, load)
- ✅ System deployed and accessible via HTTPS
- ✅ Monitoring and alerting active
- ✅ Database healthy and persistent
- ✅ Documentation complete

---

**Ready to execute?** Say "GO" to launch all 4 agents simultaneously.

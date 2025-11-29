# Phase 6 Growth Agents - Rollout Guide

**Status**: ✅ Integrated - Behind Feature Flags
**Integration Date**: November 21, 2025
**Branch**: `claude/count-total-items-01MMaVUwuCPEuiTLPMdkL6Sj`

---

## Overview

Phase 6 introduces **5 Growth & Personal Development Agents** plus a **Growth Orchestrator** for concurrent agent execution. All components are production-ready and integrated behind feature flags for safe rollout.

### What's Included

**5 Growth Agents:**
1. **Journal Agent** (Rooted) - Daily alignment journal with AI summarization
2. **Niche Agent** (Grounded) - Niche discovery with embeddings clustering
3. **Mindset Agent** (Grounded) - Limiting belief reframing
4. **Rhythm Agent** (Rooted) - Calendar density analysis and pause scheduling
5. **Purpose Agent** (Radiant) - Ikigai-based purpose discovery

**Growth Orchestrator:**
- BullMQ-based job queue system
- Concurrent agent execution
- Progress tracking and monitoring
- Health checks and readiness status

**New API Endpoints:**
- `POST /api/orchestrator/launch` - Launch all growth agents
- `GET /api/orchestrator/health` - Health and status check
- `GET /api/orchestrator/readiness` - Agent readiness status
- `GET /api/orchestrator/monitor` - Progress monitoring

**New Dashboard:**
- `/agents` - Growth agents monitoring UI (when enabled)

---

## Feature Flags

Phase 6 is controlled by two environment variables:

### `ENABLE_GROWTH_AGENTS`
- **Default**: `false`
- **Purpose**: Master toggle for all growth agent endpoints
- **Effect**: When `false`, all `/api/orchestrator/*` endpoints return 403

### `ENABLE_GROWTH_DASHBOARD`
- **Default**: `false`
- **Purpose**: Controls visibility of growth agents dashboard UI
- **Effect**: When `false`, `/agents` route is not mounted

---

## Rollout Steps

### Phase 1: Staging Environment (Dark Launch)

1. **Enable Growth Agents Only** (no dashboard)
   ```bash
   # In staging .env
   ENABLE_GROWTH_AGENTS=true
   ENABLE_GROWTH_DASHBOARD=false
   GROWTH_QUEUE_NAME=growth-agents-staging

   # Required for agents
   GOOGLE_SERVICE_ACCOUNT_JSON_B64=<base64-encoded-json>
   TWILIO_ACCOUNT_SID=<your-twilio-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-token>
   TWILIO_FROM_NUMBER=<your-twilio-number>
   GMAIL_SENDER_ADDRESS=<your-gmail>
   ```

2. **Deploy to Staging**
   ```bash
   git checkout claude/count-total-items-01MMaVUwuCPEuiTLPMdkL6Sj
   # Deploy via your CI/CD pipeline
   ```

3. **Verify Health**
   ```bash
   curl https://staging-api.yourdomain.com/health
   # Should show status: running

   curl https://staging-api.yourdomain.com/api/orchestrator/health
   # Should return: redis, queue, agentRegistry status
   ```

4. **Test Agent Launch**
   ```bash
   curl -X POST https://staging-api.yourdomain.com/api/orchestrator/launch
   # Should return: 5 jobIds
   ```

5. **Monitor Progress**
   ```bash
   curl https://staging-api.yourdomain.com/api/orchestrator/monitor?limit=100
   # Check for progress events and completion
   ```

6. **Run For 24-48 Hours**
   - Monitor logs for errors
   - Check Redis queue health
   - Verify BullMQ worker stability
   - Validate agent outputs (Google Sheets, PDFs, emails)

### Phase 2: Enable Dashboard (Internal Testing)

1. **Enable Dashboard**
   ```bash
   # In staging .env
   ENABLE_GROWTH_DASHBOARD=true
   ```

2. **Restart Services**
   ```bash
   # Redeploy or restart API service
   ```

3. **Access Dashboard**
   ```
   https://staging-api.yourdomain.com/agents
   ```

4. **Test UI**
   - Launch agents via UI
   - Monitor progress in real-time
   - Verify agent completion status
   - Check error handling

### Phase 3: Production Dark Launch

1. **Deploy to Production** (flags still false)
   ```bash
   git checkout claude/count-total-items-01MMaVUwuCPEuiTLPMdkL6Sj
   # Merge to main if required by your workflow
   # Deploy via production pipeline
   ```

2. **Verify Core Functionality Still Works**
   ```bash
   curl https://api.yourdomain.com/health
   curl https://api.yourdomain.com/api/agents
   curl https://api.yourdomain.com/api/dashboard
   # All should work normally
   ```

3. **Enable Growth Agents for Limited Users**
   - Create separate API key or user flag
   - Enable only for internal team members
   - Monitor closely

### Phase 4: Full Production Rollout

1. **Enable for All Users**
   ```bash
   # In production .env
   ENABLE_GROWTH_AGENTS=true
   ENABLE_GROWTH_DASHBOARD=true
   ```

2. **Monitor**
   - Watch error rates
   - Monitor Redis/BullMQ queues
   - Check Google API quotas
   - Track agent completion rates

3. **Announce to Users**
   - Document new endpoints
   - Provide usage examples
   - Update API documentation

---

## Rollback Procedure

### Emergency Rollback (Immediate)

**If growth agents are causing issues:**

1. **Disable Feature Flags**
   ```bash
   # Update environment variables
   ENABLE_GROWTH_AGENTS=false
   ENABLE_GROWTH_DASHBOARD=false

   # Restart API service
   pm2 restart api  # or your process manager
   ```

2. **Verify Rollback**
   ```bash
   curl https://api.yourdomain.com/api/orchestrator/health
   # Should return 403 Forbidden
   ```

3. **Core services should continue normally**
   - All 13 core operational agents: ✅ Working
   - Voice API endpoints: ✅ Working
   - Dashboard: ✅ Working

### Partial Rollback (Keep Code, Disable Agents)

**If only specific agents are problematic:**

1. Keep feature flags enabled
2. Stop BullMQ workers processing specific agents
3. Or modify orchestrator to skip problem agents

### Full Rollback (Code Revert)

**If code changes cause regressions:**

1. **Revert to Previous Commit**
   ```bash
   git revert b37a987  # Phase 6 integration commit
   git push origin main
   ```

2. **Redeploy**
   ```bash
   # Deploy previous stable version
   ```

---

## Configuration Requirements

### Minimum Requirements (Growth Agents Disabled)
- No additional configuration needed
- Core system works as before

### Growth Agents Enabled Requirements
- **Redis**: For BullMQ queue (can use existing Redis instance)
- **Google Service Account**: For Calendar, Sheets, Drive APIs
- **OpenAI API Key**: For AI-powered content generation
- **SMTP**: For email notifications
- **Twilio** (Optional): For SMS affirmations (Purpose Agent)

### Environment Variables Checklist

```bash
# Core (already configured)
✅ NODE_ENV=production
✅ PORT=3000
✅ DATABASE_URL=<postgres-url>
✅ REDIS_URL=<redis-url>
✅ OPENAI_API_KEY=<key>

# Phase 6 Feature Flags
⚠️ ENABLE_GROWTH_AGENTS=false  # Set to true to enable
⚠️ ENABLE_GROWTH_DASHBOARD=false  # Set to true to enable
⚠️ GROWTH_QUEUE_NAME=growth-agents

# Phase 6 Integrations
⚠️ GOOGLE_SERVICE_ACCOUNT_JSON_B64=<base64-json>
⚠️ SMTP_HOST=smtp.gmail.com
⚠️ SMTP_PORT=465
⚠️ SMTP_USER=<email>
⚠️ SMTP_PASS=<app-password>
⚠️ TWILIO_ACCOUNT_SID=<sid>  # Optional
⚠️ TWILIO_AUTH_TOKEN=<token>  # Optional
⚠️ TWILIO_FROM_NUMBER=<number>  # Optional
⚠️ GMAIL_SENDER_ADDRESS=<email>
```

---

## Testing Checklist

### Pre-Deployment Tests

- [x] TypeScript build passes
- [x] Unit tests pass (growth-agents/)
- [x] Integration tests pass
- [x] Core agents regression tests pass
- [x] Feature flags work correctly

### Post-Deployment Tests (Staging)

- [ ] Health endpoint responds
- [ ] Orchestrator health check works
- [ ] Launch endpoint creates 5 jobs
- [ ] Monitor endpoint shows progress
- [ ] Readiness endpoint shows completion
- [ ] Dashboard UI loads
- [ ] Dashboard shows agent status
- [ ] Core agents still work
- [ ] Voice API still works

### Production Smoke Tests

- [ ] Health check: `GET /health`
- [ ] Core agents list: `GET /api/agents`
- [ ] Growth agents disabled by default: `GET /api/orchestrator/health` → 403
- [ ] Enable flags and verify: `GET /api/orchestrator/health` → 200

---

## Monitoring

### Key Metrics to Watch

1. **API Response Times**
   - `/api/orchestrator/*` endpoints
   - Should remain < 200ms for health/readiness
   - Launch may take longer (creates jobs)

2. **Redis Queue Depth**
   - Queue: `growth-agents`
   - Watch for buildup (indicates processing issues)

3. **BullMQ Worker Health**
   - Workers should process jobs within reasonable time
   - Journal: ~30-60s
   - Niche: ~60-90s
   - Mindset: ~45-60s
   - Rhythm: ~30-45s
   - Purpose: ~60-90s

4. **External API Quotas**
   - Google Calendar API
   - Google Sheets API
   - OpenAI API
   - Twilio SMS (if enabled)

5. **Error Rates**
   - Monitor orchestrator errors
   - Check agent validation failures
   - Watch for Google API 429s (rate limits)

### Log Monitoring

**Success Pattern:**
```
[Orchestrator] Launching 5 agents
[BullMQ] Job journal-xxx added to queue
[BullMQ] Job niche-xxx added to queue
...
[JournalAgent] Setup complete
[JournalAgent] Creating journal spreadsheet
[JournalAgent] Validation passed
```

**Error Pattern:**
```
[Orchestrator] Launch failed: <error>
[Agent] Setup failed: <error>
[Agent] Validation failed: <reason>
```

---

## Known Limitations

1. **Puppeteer Dependency**
   - Niche and Purpose agents use Puppeteer for PDF generation
   - May require Chrome/Chromium installation in production
   - Set `PUPPETEER_SKIP_DOWNLOAD=true` during npm install if needed
   - Ensure Chrome is available at runtime

2. **Google API Rate Limits**
   - Calendar API: 1M requests/day
   - Sheets API: 500 requests/100 seconds
   - If limits hit, agents will fail gracefully

3. **Email/SMS Costs**
   - Mindset, Rhythm, Purpose agents send emails
   - Purpose agent sends 7 SMS if Twilio configured
   - Monitor costs in Twilio dashboard

4. **BullMQ Worker Scalability**
   - Single worker processes jobs sequentially
   - For high volume, scale workers horizontally
   - Configure multiple workers in separate processes

---

## Troubleshooting

### Issue: Orchestrator Returns 403

**Cause**: Feature flag not enabled
**Solution**: Set `ENABLE_GROWTH_AGENTS=true` and restart

### Issue: Jobs Not Processing

**Cause**: BullMQ worker not running or Redis connection issue
**Solution**:
1. Check Redis connection: `curl /api/orchestrator/health`
2. Check worker logs for errors
3. Restart worker process

### Issue: Agent Validation Failures

**Cause**: Missing configuration or API credentials
**Solution**:
1. Check required env vars are set
2. Verify Google Service Account has correct permissions
3. Test API credentials manually

### Issue: Dashboard 404

**Cause**: `ENABLE_GROWTH_DASHBOARD` not set to true
**Solution**: Set flag and restart

### Issue: Core Agents Broken After Deploy

**Cause**: Regression in integration
**Solution**:
1. Check `/health` and `/api/agents`
2. Review integration test results
3. If broken, disable growth agents or revert deployment

---

## Success Criteria

### Staging Success
- ✅ All 5 agents launch successfully
- ✅ All agents complete without errors
- ✅ Artifacts generated (Sheets, PDFs, emails)
- ✅ Dashboard shows correct status
- ✅ Core agents unaffected
- ✅ 24-hour stability test passed

### Production Success
- ✅ Dark launch stable for 48 hours
- ✅ No increase in error rates
- ✅ Core functionality preserved
- ✅ Growth agents work as expected
- ✅ User feedback positive

---

## Support

### Documentation
- **Integration Tests**: `packages/api/tests/integration/phase6-integration.spec.ts`
- **Agent Tests**: `packages/api/tests/growth-agents/`
- **Agent Code**: `packages/api/src/growth-agents/`
- **API Routes**: `packages/api/src/growth-agents/orchestrator.router.ts`

### Contact
- Check logs first
- Review this rollout guide
- Test in staging before production changes

---

**Document Version**: 1.0
**Last Updated**: November 21, 2025
**Maintained By**: EM AI Development Team

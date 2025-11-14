# Deployment Guide

## Overview

EventStormer uses a dual-deployment architecture:
- **Frontend**: Static site deployed to GitHub Pages
- **Backend**: PartyKit server for real-time collaboration

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  GitHub Pages (Static Frontend)                     │
│  https://thepaulrayner.com/eventstormer/           │
│                                                      │
│  - Built with Vite                                  │
│  - Deployed via GitHub Actions                      │
│  - Connects to PartyKit for real-time features      │
└────────────────┬────────────────────────────────────┘
                 │
                 │ WebSocket Connection
                 ├ (EventStorming collaboration)
                 │
┌────────────────┴────────────────────────────────────┐
│  PartyKit Server (Real-time Backend)                │
│  https://eventstormer.paulrayner.partykit.dev       │
│                                                      │
│  - Yjs-based CRDT for state synchronization         │
│  - Deployed via PartyKit CLI                        │
│  - Runs on Cloudflare Workers                       │
└─────────────────────────────────────────────────────┘
```

## Environment Configuration

### Development
- **Frontend**: `http://localhost:5176/eventstormer/`
- **PartyKit**: `localhost:1999`
- Environment: Uses default values (no .env file needed)

### Production
- **Frontend**: `https://thepaulrayner.com/eventstormer/`
- **PartyKit**: `eventstormer.paulrayner.partykit.dev`
- Environment: Configured via `.env.production` and GitHub Actions

## PartyKit Deployment

### Prerequisites
1. PartyKit account with GitHub OAuth connected
2. PartyKit CLI authenticated (automatic on first use)

### Deploy PartyKit Server

```bash
# Deploy to production
npx partykit deploy

# View deployed projects
npx partykit list

# Tail live logs
npx partykit tail eventstormer

# Delete deployment (if needed)
npx partykit delete --name eventstormer --force
```

### PartyKit Configuration

File: `partykit.json`
```json
{
  "name": "eventstormer",
  "main": "party/server.ts",
  "compatibilityDate": "2025-11-07"
}
```

File: `party/server.ts`
- Implements Yjs real-time collaboration
- Includes health check endpoint at `/health`
- Logs all connections and errors for debugging

## Frontend Deployment

### GitHub Pages Setup

1. **Repository Settings**
   - Go to Settings > Pages
   - Source: GitHub Actions
   - Custom domain: `thepaulrayner.com` (if applicable)

2. **Build Configuration**
   - File: `.github/workflows/deploy.yml`
   - Triggers: Push to `main` branch
   - Environment variables injected during build

### Environment Variables

**Production** (`.env.production`):
```bash
VITE_PARTYKIT_HOST=eventstormer.paulrayner.partykit.dev
```

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
- name: Build
  run: npm run build
  env:
    VITE_PARTYKIT_HOST: eventstormer.paulrayner.partykit.dev
```

### Manual Deployment

```bash
# Build locally
npm run build

# Preview production build
npm run preview

# Deploy is automatic via GitHub Actions on push to main
git push origin main
```

## Monitoring & Debugging

### Health Checks

```bash
# Check local PartyKit server
./scripts/check-partykit-health.sh dev

# Check production PartyKit server
./scripts/check-partykit-health.sh prod
```

### Live Logs

```bash
# Tail production logs
npx partykit tail eventstormer

# View logs with filtering (if available)
npx partykit tail eventstormer --filter "Error"
```

### Browser Console Debugging

The app includes comprehensive debug logging. Open browser DevTools Console to see:

```
[Connection] Connecting to PartyKit - Host: eventstormer.paulrayner.partykit.dev, Room: demo-room
[Connection] PartyKit connection status: connected
[Persistence] Board autosaved to IndexedDB
```

### Common Issues

#### Issue: "1 online" instead of multiple users
**Cause**: PartyKit server not responding (522 error) or not deployed

**Debug**:
```bash
# Check if PartyKit server is accessible
curl -I https://eventstormer.paulrayner.partykit.dev

# Check health endpoint
curl https://eventstormer.paulrayner.partykit.dev/parties/main/test/health
```

**Fix**:
```bash
# Redeploy PartyKit server
npx partykit deploy
```

#### Issue: Mobile and desktop show different boards
**Cause**: Different PartyKit hosts (mobile using localhost, desktop using production)

**Fix**: Ensure production build uses correct `VITE_PARTYKIT_HOST` environment variable

#### Issue: PartyKit deployment times out (504 error)
**Cause**: Temporary PartyKit service issue

**Fix**: Wait and retry deployment, or check [PartyKit status/GitHub issues](https://github.com/partykit/partykit/issues)

### Health Check Endpoints

**Production**:
```bash
curl https://eventstormer.paulrayner.partykit.dev/parties/main/[room-id]/health
```

**Local**:
```bash
curl http://localhost:1999/parties/main/[room-id]/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T05:00:00.000Z",
  "room": "[room-id]",
  "connections": 2
}
```

## Uptime Monitoring (Recommended)

For production SaaS applications, consider setting up automated uptime monitoring:

### Option 1: UptimeRobot (Free)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://eventstormer.paulrayner.partykit.dev/parties/main/monitor/health`
   - Interval: 5 minutes
3. Set up alerts (email/Slack/Discord)

### Option 2: Better Stack
1. Sign up at [betterstack.com](https://betterstack.com)
2. Add health check monitor
3. Configure alerts and incident management

### Option 3: GitHub Actions (DIY)
Create `.github/workflows/health-check.yml`:
```yaml
name: PartyKit Health Check
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check PartyKit Health
        run: |
          response=$(curl -s -w "%{http_code}" https://eventstormer.paulrayner.partykit.dev/parties/main/monitor/health)
          if [ "$response" != "200" ]; then
            echo "❌ Health check failed: $response"
            exit 1
          fi
          echo "✅ Health check passed"
```

## Rollback Procedure

### Frontend Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or redeploy specific commit
git checkout [previous-commit-sha]
git push origin main --force  # Use with caution
```

### PartyKit Rollback
PartyKit doesn't have built-in rollback. To revert:
1. Checkout previous version of `party/server.ts`
2. Redeploy: `npx partykit deploy`

## Performance Monitoring

### Cloudflare Analytics
PartyKit runs on Cloudflare Workers, so you can monitor:
- Request count
- Error rate
- Response time
- Geographic distribution

Access via PartyKit dashboard (if available) or Cloudflare Workers dashboard.

### Client-Side Monitoring
Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay
- Custom analytics for collaboration metrics

## Security Considerations

1. **No authentication required** - EventStormer is designed for open collaboration
2. **CORS**: PartyKit handles CORS automatically
3. **Rate limiting**: Cloudflare provides DDoS protection
4. **Data persistence**: Currently disabled (`persist: false`), enable for production if needed

## Troubleshooting Checklist

- [ ] PartyKit server responds to health check
- [ ] GitHub Actions deployment succeeded
- [ ] Production build includes correct `VITE_PARTYKIT_HOST`
- [ ] Browser console shows successful connection
- [ ] Multiple clients can see each other in "online users" count
- [ ] Changes sync in real-time between clients

## Additional Resources

- [PartyKit Documentation](https://docs.partykit.io)
- [PartyKit Debugging Guide](https://docs.partykit.io/guides/debugging/)
- [Cloudflare Workers Debugging](https://developers.cloudflare.com/workers/testing/debugging/)
- [Yjs Documentation](https://docs.yjs.dev)

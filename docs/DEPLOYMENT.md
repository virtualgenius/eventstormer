# Deployment Guide

## Overview

EventStormer uses a dual-deployment architecture:
- **Frontend**: Static site deployed to GitHub Pages
- **Backend**: Cloudflare Workers with Durable Objects for real-time collaboration

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  GitHub Pages (Static Frontend)                     │
│  https://eventstormer.virtualgenius.com             │
│                                                      │
│  - Built with Vite                                  │
│  - Deployed via GitHub Actions                      │
│  - Connects to Cloudflare Worker for real-time      │
└────────────────┬────────────────────────────────────┘
                 │
                 │ WebSocket Connection
                 │ (Yjs CRDT sync)
                 │
┌────────────────┴────────────────────────────────────┐
│  Cloudflare Workers (Real-time Backend)             │
│  https://eventstormer-collab.paul-162.workers.dev   │
│                                                      │
│  - Yjs-based CRDT via y-partyserver                 │
│  - Durable Objects for room state                   │
│  - Deployed via wrangler CLI                        │
│  - Global edge deployment                           │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Real-time sync | Yjs (CRDT) | Conflict-free collaborative editing |
| WebSocket server | y-partyserver | Yjs sync over Cloudflare Durable Objects |
| State persistence | Durable Objects (SQLite) | Server-side room state |
| Local persistence | IndexedDB via Dexie | Client-side offline storage |
| Frontend provider | y-partyserver/provider | WebSocket connection to worker |

## Environment Configuration

### Development
- **Frontend**: `http://localhost:5180`
- **Worker**: `http://localhost:8800`
- **Config**: `.env.local` with `VITE_COLLAB_HOST=localhost:8800`

### Production
- **Frontend**: `https://eventstormer.virtualgenius.com`
- **Worker**: `https://eventstormer-collab.paul-162.workers.dev`
- **Config**: `.env.production` with production worker URL

## Development Commands

```bash
# Start both frontend and worker locally
npm run dev

# Start only frontend
npm run dev:vite

# Start only worker
npm run dev:worker

# Build frontend for production
npm run build

# Deploy worker to Cloudflare
npm run deploy:worker
```

## Cloudflare Worker Deployment

### Prerequisites
1. Cloudflare account (free tier works for development)
2. Wrangler CLI authenticated: `wrangler login`

### Manual Deployment

```bash
# Deploy worker to production
npm run deploy:worker

# View deployed workers
wrangler list

# Tail live logs
wrangler tail eventstormer-collab
```

### Configuration Files

**wrangler.toml**:
```toml
name = "eventstormer-collab"
main = "workers/server.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat_v2"]

[[durable_objects.bindings]]
name = "YjsRoom"
class_name = "YjsRoom"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["YjsRoom"]
```

**workers/server.ts**: Implements Yjs collaboration via y-partyserver with health check endpoint at `/health`.

## Frontend Deployment

### GitHub Pages Setup

1. **Repository Settings**
   - Go to Settings > Pages
   - Source: GitHub Actions

2. **GitHub Secrets Required**
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `CLOUDFLARE_API_TOKEN`: API token with Workers edit permissions

### Automatic Deployment

Push to `main` triggers two GitHub Actions:
- **deploy.yml**: Builds and deploys frontend to GitHub Pages
- **deploy-worker.yml**: Deploys worker to Cloudflare (only when `workers/` or `wrangler.toml` change)

## Monitoring & Debugging

### Health Checks

```bash
# Check production worker
curl https://eventstormer-collab.paul-162.workers.dev/health

# Check local worker
curl http://localhost:8800/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T12:00:00.000Z"
}
```

### Live Logs

```bash
# Tail production logs
wrangler tail eventstormer-collab
```

### Browser Console Debugging

Enable debug mode by setting `localStorage.setItem('debug', 'true')` in browser console.

Log output:
```
[Connection] Connecting to Collab Server - Host: eventstormer-collab.paul-162.workers.dev, Room: demo-room
[Connection] Collab server connection status: connected
[Persistence] Board autosaved to IndexedDB
```

## Common Issues

### Issue: "1 online" instead of multiple users
**Cause**: Worker not responding or connection failed

**Debug**:
```bash
curl https://eventstormer-collab.paul-162.workers.dev/health
```

**Fix**: Redeploy worker with `npm run deploy:worker`

### Issue: Changes not syncing between clients
**Cause**: WebSocket connection not established

**Fix**:
1. Check browser console for connection errors
2. Verify `VITE_COLLAB_HOST` environment variable is correct
3. Ensure worker is deployed and healthy

## Rollback Procedure

### Frontend Rollback
```bash
git revert HEAD
git push origin main
```

### Worker Rollback
```bash
git checkout [previous-commit] -- workers/server.ts wrangler.toml
npm run deploy:worker
```

## Cost Estimates

| Component | Cost |
|-----------|------|
| Cloudflare Workers Free | 100,000 requests/day |
| Durable Objects Free | 100,000 requests/day, 13,000 GB-sec/day |
| Workers Paid (if needed) | $5/month base + usage |
| GitHub Pages | Free |

## Security Considerations

1. **No authentication** - Currently open collaboration (workshop model)
2. **CORS**: Handled automatically by Cloudflare Workers
3. **Rate limiting**: Cloudflare provides DDoS protection
4. **Data persistence**: Durable Objects with SQLite storage

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)
- [y-partyserver Documentation](https://github.com/cloudflare/partykit/tree/main/packages/y-partyserver)
- [Yjs Documentation](https://docs.yjs.dev)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

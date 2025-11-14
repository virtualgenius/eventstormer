#!/bin/bash
# PartyKit Health Check Script
# Usage: ./scripts/check-partykit-health.sh [environment]
# environment: dev (default) or prod

set -e

ENVIRONMENT="${1:-dev}"

if [ "$ENVIRONMENT" = "prod" ]; then
  HOST="https://eventstormer.paulrayner.partykit.dev"
  echo "🔍 Checking PRODUCTION PartyKit server..."
else
  HOST="http://localhost:1999"
  echo "🔍 Checking LOCAL PartyKit server..."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if server is reachable
echo "📡 Testing server reachability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HOST" || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
  echo "❌ Server is not reachable"
  exit 1
elif [ "$HTTP_CODE" = "522" ]; then
  echo "❌ Server timeout (522) - Cloudflare cannot reach origin"
  exit 1
elif [ "$HTTP_CODE" = "404" ]; then
  echo "✅ Server is reachable (404 is expected for root)"
else
  echo "✅ Server responded with HTTP $HTTP_CODE"
fi

# Check health endpoint for a test room
echo ""
echo "🏥 Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s "$HOST/parties/main/test-health/health" || echo "ERROR")

if [ "$HEALTH_RESPONSE" = "ERROR" ]; then
  echo "❌ Health check failed"
  exit 1
else
  echo "✅ Health check response:"
  echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
fi

# Test WebSocket upgrade (if in dev mode)
if [ "$ENVIRONMENT" = "dev" ]; then
  echo ""
  echo "🔌 Testing WebSocket upgrade capability..."
  WS_TEST=$(curl -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" "$HOST/parties/main/test-room" | grep -i "HTTP" || echo "")
  if [ -n "$WS_TEST" ]; then
    echo "✅ WebSocket upgrade headers accepted"
  else
    echo "⚠️  Could not verify WebSocket upgrade"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Health check complete!"

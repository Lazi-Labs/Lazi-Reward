#!/bin/zsh
# Flip Vercel PROD env to the production Tremendous account, then redeploy.
# Reads the staged TREMENDOUS_PROD_* values already appended to .env.local.
#   ./scripts/flip-tremendous.sh
set -e
cd "$(dirname "$0")/.."
KEY=$(grep '^TREMENDOUS_PROD_API_KEY=' .env.local | cut -d= -f2)
WHS=$(grep '^TREMENDOUS_PROD_WEBHOOK_SECRET=' .env.local | cut -d= -f2)
[ -n "$KEY" ] && [ -n "$WHS" ] || { echo "staged TREMENDOUS_PROD_* values missing from .env.local"; exit 1; }
printf '%s' "$KEY" | vercel env add TREMENDOUS_API_KEY production --force --scope liv-pools
printf '%s' "https://api.tremendous.com/api/v2" | vercel env add TREMENDOUS_API_URL production --force --scope liv-pools
printf '%s' "V0U6FF6L62MW" | vercel env add TREMENDOUS_FUNDING_SOURCE_ID production --force --scope liv-pools
printf '%s' "$WHS" | vercel env add TREMENDOUS_WEBHOOK_SECRET production --force --scope liv-pools
echo "env set — redeploying latest prod deployment"
# `vercel ls | head -1` picked up a banner line, not a URL, so the redeploy silently never happened and the
# app kept running with the old sandbox env (2026-08-30). Take the first real deployment URL instead.
LATEST=$(vercel ls pce-rewards --scope liv-pools 2>/dev/null | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1)
[ -n "$LATEST" ] || { echo "could not find a deployment to redeploy"; exit 1; }
echo "redeploying $LATEST"
vercel redeploy "$LATEST" --scope liv-pools

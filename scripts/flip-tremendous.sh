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
LATEST=$(vercel ls pce-rewards --scope liv-pools 2>/dev/null | head -1)
vercel redeploy "$LATEST" --scope liv-pools

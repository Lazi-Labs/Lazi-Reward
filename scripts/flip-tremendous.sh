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
# Balance, not the Visa: Tremendous only allows credit cards for dashboard orders and for topping up the
# balance ("usage_permissions"), so an API order funded by the card is rejected with a misleading
# "funding source ... could not be found" (2026-08-30). Top the balance up from the card, order from balance.
printf '%s' "RC7VTB92NKIA" | vercel env add TREMENDOUS_FUNDING_SOURCE_ID production --force --scope liv-pools
printf '%s' "$WHS" | vercel env add TREMENDOUS_WEBHOOK_SECRET production --force --scope liv-pools
echo "env set — redeploying latest prod deployment"
# A redeploy reuses the previous build output and kept serving the old env, so build fresh instead (2026-08-30).
vercel deploy --prod --scope liv-pools

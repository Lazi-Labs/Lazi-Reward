# LAZI Rewards - Task Tracker

## Current Sprint: Foundation & Verification

### P0 - Critical (Do First)
- [ ] Project scaffolding (Next.js 14, TypeScript, Tailwind, shadcn/ui)
- [ ] Database schema for rewards tables (points_transactions, tiers, redemptions, referrals)
- [ ] Zod validation schemas for all reward entities
- [ ] Supabase connection + auth setup
- [ ] Points engine core logic with unit tests
- [ ] Customer rewards dashboard (view points, tier, history)
- [ ] Redemption flow (select reward → confirm → deduct points)
- [ ] Full verification pass (`/verify`)

### P1 - High Priority (Do Next)
- [ ] Admin dashboard (view all customers, adjust points, analytics)
- [ ] Referral system (generate codes, track conversions, award points)
- [ ] Email notification triggers (via n8n or Supabase Edge Functions)
- [ ] ST-LAZI webhook/polling for job completion → auto-award points

### P2 - Enhancement (Do After P0+P1 Verified)
- [ ] UI polish pass (`/enhance-ui` on each page)
- [ ] Review rewards integration
- [ ] Milestone/anniversary rewards
- [ ] Gamification (badges, streaks)
- [ ] Performance optimization (caching, lazy loading)

## Verification Status
- [ ] TypeScript: Not yet checked
- [ ] Lint: Not yet checked
- [ ] Tests: Not yet checked
- [ ] Build: Not yet checked
- [ ] E2E: Not yet configured

## Discovered During Work
<!-- Add new tasks/issues found during development here -->

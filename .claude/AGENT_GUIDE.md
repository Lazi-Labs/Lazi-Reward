# LAZI Rewards Agent Team Guide

## Overview
The LAZI Rewards project uses 5 specialized Claude agents working in coordination:

1. **backend-engineer** — API routes, database, business logic
2. **frontend-architect** — React components, pages, layouts
3. **test-engineer** — Unit, integration, E2E tests
4. **st-integration** — ServiceTitan data queries and syncing
5. **verification-agent** — CI/CD pipeline, validation, quality checks

## How to Use

### Option 1: Direct Requests
```
Use the backend-engineer to build /api/rewards/customer endpoint
Use the frontend-architect to create the rewards dashboard
Use the test-engineer to write tests
Use the verification-agent to validate everything
```

### Option 2: Execute a PRP
```
/execute-prp PRPs/rewards-foundation.md
```
This runs the entire plan with automatic agent delegation.

### Option 3: List Available Agents
```
/agents
```

## Delegation Pattern (For Developers)
```
# Phase 2: API Foundation

## Backend work (parallel)
Task(backend-engineer): "Build GET /api/rewards/customer endpoint:
- Input: customerId (Zod validated)
- Output: { data: CustomerRewards, error, meta }
- Logic: Query rewards.customers, fetch tier benefits, return current points
- Must pass all tests before considering done"

Task(frontend-architect): "Build CustomerRewardsCard component:
- Show points balance, tier name, progress to next tier
- States: loading (skeleton), error (+retry button), populated
- Responsive: mobile-first from 375px
- Colors: LIV blue #1e3a5f for primary, orange #ff6b35 for accent"

# After both complete in parallel:
Task(test-engineer): "Write tests:
- Unit: Points calculation, tier logic
- Integration: /api/rewards/customer endpoint
- Component: CustomerRewardsCard with all states
- Target 80%+ coverage"

Task(verification-agent): "Run full pipeline:
- TypeScript check
- Lint
- Tests
- Build
- Report status"
```

## Agent Responsibilities

### backend-engineer
- ✅ API routes (`/api/rewards/*`)
- ✅ Database queries
- ✅ Zod validation
- ✅ Points calculation engine
- ✅ Authentication/authorization
- ❌ UI components (that's frontend-architect)
- ❌ ServiceTitan schema questions (that's st-integration)

### frontend-architect
- ✅ React components
- ✅ Pages and layouts
- ✅ TailwindCSS + shadcn/ui
- ✅ Animations (Framer Motion)
- ✅ Accessibility
- ❌ API routes (that's backend-engineer)
- ❌ Complex business logic (that's backend)

### test-engineer
- ✅ Unit tests (Vitest)
- ✅ Component tests (React Testing Library)
- ✅ Integration tests
- ✅ Test data factories
- ✅ Mock Supabase
- ❌ Implementing features (that's backend/frontend)
- ❌ Running verification pipeline (that's verification-agent)

### st-integration
- ✅ Queries to `master.*` and `crm.*` schemas
- ✅ Recommendations on JOIN strategy
- ✅ ServiceTitan business rules
- ✅ Data sync timing and considerations
- ❌ Modifying master.* tables (read-only)
- ❌ Implementing features (consult instead)

### verification-agent
- ✅ TypeScript compilation check
- ✅ ESLint validation
- ✅ Running test suite
- ✅ Production build test
- ✅ Status reports
- ❌ Fixing code (just reports issues)
- ❌ Implementing features

## Rules

1. **Never skip the test-engineer** — Features aren't done without tests
2. **Always run verification-agent at phase end** — Before merging
3. **Ask st-integration before master.* queries** — Avoid data mistakes
4. **Backend and frontend work in parallel** — Speed up delivery
5. **Use proper agent tools** — Read, Write, Bash for their domain
6. **Communicate in tasks** — "Task(agent-name): 'description'"

## Configuration Files
- `.claude/settings.local.json` — Permissions and safety rules
- `.claude/agents/*.md` — Agent definitions and expertise
- `.claude/commands/*.md` — Custom commands (like /generate-prp)

## Next Steps
1. Ensure all agents are loaded: `/agents`
2. Read the PRPs in `/lazi-rewards-agent/PRPs/` for context
3. Use agents for Phase 2: "Build API endpoints for customer rewards"

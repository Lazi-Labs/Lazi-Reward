# LAZI Rewards - Claude Code Project Rules

## Project Overview

LAZI Rewards is a customer loyalty and rewards platform for LIV Pools and Perfect Catch Electric. It connects to ServiceTitan via the ST-LAZI ingestion service (PostgreSQL backend with 60+ synced entities) and provides a modern React frontend for customers and internal staff to manage rewards, referrals, and engagement programs.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LAZI REWARDS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   Frontend   │     │        Backend API           │ │
│  │  React/Next  │────▶│   Express or Next API Routes │ │
│  │  TailwindCSS │     │                              │ │
│  └──────────────┘     └──────────┬───────────────────┘ │
│                                  │                      │
│                                  ▼                      │
│                    ┌──────────────────────────┐         │
│                    │  ST-LAZI PostgreSQL DB   │         │
│                    │  (Supabase)              │         │
│                    │  ┌────────┐ ┌─────────┐ │         │
│                    │  │master.*│ │  crm.*  │ │         │
│                    │  │raw.*   │ │outbound.│ │         │
│                    │  └────────┘ └─────────┘ │         │
│                    └──────────────────────────┘         │
│                                  ▲                      │
│                                  │ Bidirectional Sync   │
│                    ┌──────────────────────────┐         │
│                    │   ServiceTitan API       │         │
│                    └──────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React 18+ / Next.js 14+, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes or Express.js, TypeScript
- **Database**: PostgreSQL via Supabase (shared with ST-LAZI)
- **Auth**: Supabase Auth or custom JWT
- **State**: React Query (TanStack Query) for server state, Zustand for client state
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Validation**: Zod schemas shared between frontend and backend

## Code Standards

### TypeScript
- IMPORTANT: Strict TypeScript everywhere. No `any` types unless absolutely necessary with a comment explaining why.
- Use Zod schemas for ALL external data validation (API responses, form inputs, URL params).
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `as const` assertions for literal types.
- All async functions must have proper error handling with typed errors.

### React/Frontend
- Use functional components with hooks exclusively.
- Prefer server components where possible (Next.js App Router).
- Use `use client` directive only when client interactivity is required.
- All forms use react-hook-form + zod resolver.
- IMPORTANT: Every user-facing action must have loading, error, and success states.
- Use optimistic updates for better UX where appropriate.
- Mobile-first responsive design using Tailwind breakpoints.

### API/Backend
- All API routes validate input with Zod before processing.
- Return consistent response shapes: `{ data, error, meta }`.
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- Log errors with structured logging (include request ID, user context).
- Rate limit sensitive endpoints.

### Database
- IMPORTANT: Never write raw SQL in API routes. Use a query builder or ORM layer.
- All database queries must be parameterized (no string interpolation).
- Use transactions for multi-table operations.
- Reference ST-LAZI tables via `master.*` schema for reads, `outbound.mutations` for writes back to ServiceTitan.

### Testing (CRITICAL PRIORITY)
- IMPORTANT: Every new feature MUST include tests before it is considered complete.
- Unit tests for all utility functions, hooks, and business logic.
- Integration tests for API routes (test request → response cycle).
- Component tests for interactive UI elements.
- E2E tests for critical user flows (login, earn rewards, redeem).
- Test files live alongside source: `component.tsx` → `component.test.tsx`
- Use `describe/it` blocks with descriptive test names.
- Mock external services (Supabase, ServiceTitan) in tests.
- Run `npm test` after every significant change to verify nothing broke.

### Verification Checklist
Before considering any task complete, verify:
1. ✅ TypeScript compiles with zero errors (`npm run typecheck`)
2. ✅ All tests pass (`npm test`)
3. ✅ Linting passes (`npm run lint`)
4. ✅ Build succeeds (`npm run build`)
5. ✅ No console errors in browser
6. ✅ Responsive on mobile/tablet/desktop
7. ✅ Loading/error/empty states all work
8. ✅ Zod validation catches malformed input

## File Organization

```
lazi-rewards/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth-related pages
│   │   ├── (dashboard)/        # Authenticated dashboard pages
│   │   ├── api/                # API routes
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── forms/              # Form components
│   │   ├── rewards/            # Rewards-specific components
│   │   ├── customers/          # Customer-facing components
│   │   └── shared/             # Shared/layout components
│   ├── lib/
│   │   ├── db/                 # Database queries & connection
│   │   ├── auth/               # Auth utilities
│   │   ├── rewards/            # Rewards business logic
│   │   ├── servicetitan/       # ST-LAZI integration helpers
│   │   ├── validations/        # Zod schemas (shared)
│   │   └── utils/              # General utilities
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript type definitions
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   ├── integration/            # API integration tests
│   └── setup.ts                # Test setup/globals
├── public/                     # Static assets
├── CLAUDE.md                   # This file
├── TASK.md                     # Current task tracking
└── PRPs/                       # Product Requirements Prompts
```

## Key Domain Concepts

### Rewards Program
- **Points**: Earned from completed jobs, referrals, reviews, and engagement
- **Tiers**: Bronze → Silver → Gold → Platinum based on lifetime points
- **Redemptions**: Points can be redeemed for discounts on future services
- **Referrals**: Customers earn bonus points for referring new customers
- **Milestones**: Special bonuses for anniversaries, job count milestones

### ServiceTitan Integration (via ST-LAZI)
- Customer data synced from `master.customers`
- Job completion triggers point awards via `master.jobs` (status = 'Completed')
- Invoice totals from `master.invoices` determine point value
- CRM 360 views from `crm.customer_360` provide engagement data
- Mutations pushed back via `outbound.mutations` table

### Critical Business Rules
- IMPORTANT: Points only awarded for jobs with status "Completed" and fully paid invoices
- Referral bonus only awarded after referred customer's first completed job
- Tier calculation uses lifetime earned points (not current balance)
- Redemptions cannot exceed current point balance
- All point transactions must have an audit trail

## Task Management
- Mark completed tasks in TASK.md immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to TASK.md under a "Discovered During Work" section.
- Update TASK.md with verification results after running tests.

## Agent Team

This project uses specialized subagents in `.claude/agents/`. Claude will automatically delegate to the right agent based on the task, or you can invoke them explicitly.

| Agent | Role | When to Use |
|-------|------|-------------|
| `test-engineer` | Write + run tests, verify coverage | PROACTIVELY after ANY code change |
| `verification-agent` | Run full CI pipeline, report pass/fail | Before any PR or merge |
| `frontend-architect` | React/Next.js components, UI/UX, responsive design | Building or polishing UI |
| `backend-engineer` | API routes, DB queries, business logic, auth | Server-side features |
| `st-integration` | ServiceTitan data, ST-LAZI schemas, sync logic | Any ST data interaction |

### How Agents Work Together
1. **Plan** → Main agent creates the plan from PRP
2. **Build** → `backend-engineer` handles API + DB, `frontend-architect` handles UI
3. **Test** → `test-engineer` writes tests for everything built
4. **Verify** → `verification-agent` runs the full pipeline
5. **Review** → `st-integration` audits any ServiceTitan touchpoints

### Invoking Agents Explicitly
```
Use the test-engineer agent to write tests for the points engine
Use the verification-agent to run a full check
Use the frontend-architect to enhance the rewards dashboard
Use the st-integration agent to review all database queries
```

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/generate-prp INITIAL.md` | Generate a PRP from feature spec |
| `/execute-prp PRPs/file.md` | Execute a PRP step by step |
| `/verify` | Run full verification suite |
| `/enhance-ui component` | Polish a UI component |
| `/test-agent` | Invoke testing specialist |
| `/review-st-integration` | Audit ST-LAZI data queries |

## Git Workflow
- Feature branches: `feature/rewards-dashboard`, `feature/referral-system`
- Commit messages: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- Always run verification checklist before committing.

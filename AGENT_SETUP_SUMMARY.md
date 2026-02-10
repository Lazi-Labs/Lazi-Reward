# LAZI Rewards Agent Team - Setup Complete ✅

## What's Been Configured

### 1. Five Specialized Agents
All agents are defined in `.claude/agents/` with specific expertise:

**backend-engineer** (`backend-engineer.md`)
- Builds API routes, database queries, business logic
- Tools: Read, Write, Edit, Bash, Grep, Glob
- Uses: Next.js API routes, Supabase, Zod validation

**frontend-architect** (`frontend-architect.md`)
- Builds React components, pages, layouts
- Tools: Read, Write, Edit, Bash, Grep, Glob
- Stack: Next.js, TailwindCSS, shadcn/ui, Framer Motion
- Design tokens: LIV blue (#1e3a5f), Perfect Catch orange (#ff6b35)

**test-engineer** (`test-engineer.md`)
- Writes unit, integration, component tests
- Tools: Read, Write, Edit, Bash, Grep, Glob
- Stack: Vitest, React Testing Library, JSDOM
- Rule: Test ALONGSIDE code, never after

**st-integration** (`st-integration.md`)
- Reviews ServiceTitan queries and data access
- Tools: Read, Bash, Grep, Glob
- Expertise: ST-LAZI schemas (master.*, crm.*, outbound.mutations)
- Rule: Always consult before master.* queries

**verification-agent** (`verification-agent.md`)
- Runs CI/CD pipeline and quality checks
- Tools: Read, Bash, Grep, Glob
- Checks: TypeScript, Lint, Tests, Build
- Rule: Always run before merging

### 2. Agent Orchestration Rules (in CLAUDE.md)
- ALWAYS delegate to agents - don't implement everything yourself
- Run backend + frontend in PARALLEL for speed
- test-engineer runs AFTER each phase
- verification-agent runs at END before merge
- Ask st-integration before touching ServiceTitan data

### 3. Project Files
- `.claude/AGENT_GUIDE.md` — Complete guide with delegation patterns
- `.claude/commands/generate-prp.md` — Custom command for PRP generation
- `.claude/settings.local.json` — Permissions and safety rules

### 4. API Foundation Utilities (Phase 2 start)
- `src/lib/utils/errors.ts` — Typed error classes
  - AppError, ValidationError, AuthenticationError, NotFoundError, etc.
  - All return proper HTTP status codes
  
- `src/lib/utils/api-response.ts` — Response builders
  - successResponse<T>() — typed success response
  - errorResponse() — consistent error format
  - toNextResponse() — convert to NextResponse
  - handleApiError() — error handler

## How to Use the Agent Team

### Option 1: Direct Requests
```bash
Use the backend-engineer to build /api/rewards/customer endpoint
Use the test-engineer to write tests
Use the verification-agent to check everything passes
```

### Option 2: Check Agents are Loaded
```
/agents
```
Should list all 5 agents.

### Option 3: List Available Commands
```
/commands
```
Will show generate-prp and other custom commands.

## Next Steps - Phase 2: API Foundation

The backend-engineer should now build:
1. `GET /api/rewards/customer` — Fetch customer rewards data
2. `GET /api/rewards/tiers` — Fetch tier configuration
3. `GET /api/rewards/history` — Fetch transaction history (paginated)
4. `GET /api/rewards/redemptions` — Fetch available redemptions
5. `POST /api/rewards/redeem` — Submit redemption request

All endpoints should:
- Use Zod validation
- Return consistent `{ data, error, meta }` format
- Have proper error handling
- Be tested with 80%+ coverage

## Files to Review
- `CLAUDE.md` — Updated with agent rules
- `.claude/AGENT_GUIDE.md` — Complete delegation guide
- `.claude/agents/*.md` — Individual agent specs
- `src/lib/types/rewards.ts` — Zod schemas
- `src/lib/utils/points.ts` — Points calculation logic
- `database/schema/001_create_rewards_schema.sql` — Database structure

## Status
✅ Phase 1: Complete (Next.js, database schema, types, utilities)
⏳ Phase 2: Ready for agent delegation (API endpoints)
⏳ Phases 3-8: Pending

---

**You can now:**
1. Request work from agents using the guide above
2. Run `/agents` to verify all are loaded
3. Ask agents to build features in parallel
4. Use verification-agent to check quality

The team is ready to build! 🚀

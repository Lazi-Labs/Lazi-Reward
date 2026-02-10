---
name: "[FEATURE NAME]"
description: |
  [What needs to be built - specific end state and business value]
priority: P0|P1|P2
estimated_tasks: [N]
---

## Design Principles
- Context is King: Include ALL necessary documentation, examples, and caveats
- Validation Loops: Provide executable tests the AI can run and fix
- Information Dense: Use keywords and patterns from the codebase
- Progressive Success: Start simple, validate, then enhance
- Global rules: Follow all rules in CLAUDE.md

## Objective
[Clear description of what success looks like]

## Existing Context

### Relevant Files
```
[List existing files to reference for patterns]
```

### Database Tables
```sql
-- List ST-LAZI tables involved
-- master.customers, master.jobs, crm.customer_360, etc.
```

### Existing Patterns
[Reference code patterns from the codebase or examples/ folder]

## Implementation Plan

### Task 1: [Name]
**Files:** CREATE/MODIFY `path/to/file.ts`

**Details:**
- PATTERN: [Reference existing pattern]
- [Specific implementation instructions]
- [Zod schema if needed]

**Verify:**
```bash
npm run typecheck
npm test -- --grep "task1"
```

### Task 2: [Name]
[Same structure...]

### Task N: [Name]
[Same structure...]

## Verification Requirements

### Tests Required
- [ ] Unit tests for [business logic]
- [ ] Integration tests for [API routes]
- [ ] Component tests for [UI components]
- [ ] E2E test for [critical flow]

### Final Verification
```bash
npm run typecheck  # Zero errors
npm run lint       # Zero warnings
npm test           # All green
npm run build      # Builds successfully
```

## UI/UX Requirements (if applicable)
- Mobile-first responsive (375px → 768px → 1024px)
- Loading: Skeleton loaders matching content shape
- Error: Friendly message + retry button
- Empty: Illustration + CTA
- Animations: Subtle transitions, number counters

## Notes / Caveats
[Edge cases, known limitations, dependencies on other features]

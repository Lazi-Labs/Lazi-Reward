Read the PRP file at $ARGUMENTS carefully. This is your implementation blueprint.

## Execution Rules

IMPORTANT: Follow these rules strictly during implementation:

### 1. Read First
- Read CLAUDE.md for project rules
- Read the PRP completely before writing any code
- Identify all files that need to be created or modified
- Check existing codebase patterns referenced in the PRP

### 2. Progressive Implementation
- Implement tasks IN ORDER as specified in the PRP
- After EACH task, run the verification command specified
- Fix any errors before moving to the next task
- Update TASK.md with progress after each task

### 3. Verification After Every Task
Run these checks after completing each task:
```bash
npm run typecheck    # TypeScript must compile clean
npm run lint         # No lint errors
npm test             # All tests pass
```
If any check fails, fix it BEFORE proceeding to the next task.

### 4. Testing Requirements
- Write tests ALONGSIDE the implementation, not after
- Every function/component gets a test
- Test the happy path, error cases, and edge cases
- For UI components: test loading, error, empty, and populated states

### 5. After All Tasks Complete
Run the full verification suite:
```bash
npm run typecheck
npm run lint  
npm test
npm run build
```

### 6. Update TASK.md
Mark all completed tasks and add any discovered work items.

### 7. Summary
After implementation, provide:
- What was built (files created/modified)
- Test results summary
- Any issues encountered and how they were resolved
- Remaining work or improvements for future PRPs

IMPORTANT: Do NOT skip verification steps. The goal is working, tested, verified code — not just generated code.

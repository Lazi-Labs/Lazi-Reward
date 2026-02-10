Run a comprehensive verification of the entire LAZI Rewards codebase. This is the "make sure everything works" command.

## Verification Steps (Run ALL of these in order)

### Step 1: TypeScript Compilation
```bash
npm run typecheck
```
Report any type errors. Fix them if possible.

### Step 2: Linting
```bash
npm run lint
```
Report and fix any lint violations.

### Step 3: Unit & Integration Tests
```bash
npm test -- --reporter=verbose
```
Report test results. For any failures:
- Read the failing test
- Read the code being tested  
- Determine if the test or the code is wrong
- Fix the issue
- Re-run

### Step 4: Build Check
```bash
npm run build
```
Verify the production build succeeds without errors.

### Step 5: E2E Tests (if available)
```bash
npm run test:e2e 2>/dev/null || echo "No E2E tests configured yet"
```

### Step 6: Dependency Audit
```bash
npm audit --production 2>/dev/null || echo "Audit check skipped"
```

### Step 7: Dead Code / Unused Exports
Check for any obviously unused imports or exports in recently modified files.

### Step 8: Database Schema Validation
Verify that any Zod schemas in `src/lib/validations/` match the expected database table structures from ST-LAZI.

## Report Format

After running all checks, provide a summary:

```
## Verification Report - [DATE]

### ✅ Passing
- [list what passed]

### ❌ Failing  
- [list what failed with details]

### ⚠️ Warnings
- [list warnings or areas of concern]

### 🔧 Auto-Fixed
- [list anything that was automatically fixed]

### 📋 Recommendations
- [list improvements or follow-up items]
```

Update TASK.md with the verification results.

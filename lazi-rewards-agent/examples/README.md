# Examples - LAZI Rewards

These files serve as **reference patterns** for Claude Code when generating new features. They demonstrate the coding conventions, validation approach, testing patterns, and database schema that should be followed throughout the project.

## Files

| File | Purpose | Pattern It Demonstrates |
|------|---------|------------------------|
| `rewards-schema.sql` | Database schema for the rewards system | Table design, constraints, indexes, `rewards.*` schema separation from ST-LAZI |
| `rewards-schemas.ts` | Zod validation schemas | Input/output validation, shared types, API response shapes |
| `points-engine.ts` | Core business logic | Pure functions, config constants, Zod parsing, error handling |
| `points-engine.test.ts` | Unit tests | Vitest patterns, describe/it blocks, edge case coverage, error testing |

## How Claude Code Should Use These

When implementing new features, Claude should:
1. **Read these files first** to understand the patterns
2. **Follow the same structure** for new business logic (pure functions, Zod input, error handling)
3. **Write tests alongside code** using the same testing patterns
4. **Use the database schema** as a reference for table naming and column conventions
5. **Share Zod schemas** between frontend and backend (don't duplicate validation)

Read the file provided as $ARGUMENTS (this is the initial feature request).

Then generate a comprehensive PRP (Product Requirements Prompt) following these principles:

## PRP Generation Rules

1. **Context is King**: Include ALL necessary documentation, examples, architecture details, and caveats so a coding agent can implement without asking questions.

2. **Validation Loops**: Every task MUST include executable verification steps (tests, type checks, lint, build) that the agent can run and fix iteratively.

3. **Information Dense**: Use keywords, patterns, and conventions from CLAUDE.md and the existing codebase.

4. **Progressive Success**: Start simple → validate → enhance. Never build everything at once.

5. **ST-LAZI Awareness**: Reference the correct database schemas (master.*, crm.*, outbound.*) and include the ServiceTitan data model context.

## PRP Structure

Generate the PRP with these sections:

### Header
- name: descriptive feature name
- description: what it does and business value
- priority: P0 (critical), P1 (high), P2 (medium)

### Existing Context
- Reference relevant files from the codebase
- List database tables/views involved
- Note any existing patterns to follow

### Implementation Plan
Break into numbered Tasks (max 6-8 per PRP):
- Each task: CREATE or MODIFY specific files
- Include PATTERN references to existing code
- Specify Zod schemas for any data validation
- Include the exact verification command to run after each task

### Verification Requirements
- Unit tests for business logic
- Integration tests for API routes
- Component tests for UI
- E2E test for the critical user flow
- TypeScript compilation check
- Lint check
- Build check

### UI/UX Requirements (if applicable)
- Mobile-first responsive design
- Loading, error, and empty states
- Accessibility (ARIA labels, keyboard nav)
- Consistent with existing design system

Save the PRP to `PRPs/` with a descriptive filename like `PRPs/feature-name-prp.md`.

IMPORTANT: After generating, summarize what was created and remind to review before executing with `/execute-prp`.

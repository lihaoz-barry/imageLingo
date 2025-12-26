# Claude Code Instructions

## Pre-Push Checklist

**IMPORTANT:** Before pushing any changes to the repository, you MUST run these commands and ensure they all pass:

```bash
# 1. TypeScript type check (REQUIRED)
npx tsc --noEmit

# 2. ESLint check (REQUIRED - must have 0 errors)
npm run lint

# 3. Run all tests (REQUIRED)
npm test
```

If any of these fail, fix the issues before pushing. Do NOT push code that fails these checks.

## Quick Combined Check

Run all checks at once:
```bash
npx tsc --noEmit && npm run lint && npm test
```

## Common Issues

### TypeScript Errors
- Always read the actual source file to understand the correct types/signatures
- Mock classes must match the real class constructor signatures
- Check for missing dependencies with `npm install`

### ESLint Errors vs Warnings
- **Errors (exit code 1)**: Must be fixed before pushing
- **Warnings**: Can be addressed later, won't block CI

### Test Failures
- Ensure mocks match the actual implementation
- Check that async mocks return proper Promise-like objects (e.g., `arrayBuffer()` method for Blob mocks)

## Project Structure

- **Tests**: `__tests__/` directory, using Vitest
- **API Routes**: `app/api/` (Next.js App Router)
- **Components**: `components/`
- **Lib/Utils**: `lib/`

## CI/CD Pipeline

GitHub Actions runs on PR to `main`:
1. `npm run lint` - ESLint
2. `npm test` - Vitest
3. `npx tsc --noEmit` - TypeScript check

All three must pass for the PR to be mergeable.

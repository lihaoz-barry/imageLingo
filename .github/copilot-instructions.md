# GitHub Copilot Agent Instructions

## 🎯 Overview
This document provides instructions for GitHub Copilot when assisting with imageLingo development.

---

## 📋 Pre-Submission Quality Checks

**You MUST verify code quality before suggesting commits:**

### Step 1: Code Quality Verification
```bash
npm run lint
```
✅ Must have 0 errors (warnings are acceptable)

### Step 2: Type Safety Check
```bash
npx tsc --noEmit
```
✅ Must complete with exit code 0 (no errors)

### Step 3: Test Coverage
```bash
npm test
```
✅ All tests must pass

---

## 💻 Code Standards

### TypeScript
- ✅ Use strict mode - no `any` types without justification
- ✅ Proper interface definitions for all parameters
- ✅ Avoid `// @ts-ignore` comments without explanation
- ✅ Use type imports: `import type { ... }`

### React Components
- ✅ Use functional components with hooks
- ✅ Proper dependency arrays in useEffect
- ✅ Memoize expensive components with React.memo
- ✅ Handle loading and error states
- ✅ Use proper TypeScript prop interfaces

### API Routes
- ✅ Use middleware for auth (requireAuth, requireAdmin)
- ✅ Validate and sanitize all inputs
- ✅ Return proper HTTP status codes
- ✅ Include error handling
- ✅ Log important actions (admin actions especially)

### Testing
- ✅ Test API routes with mocked dependencies
- ✅ Test components with vitest + React Testing Library
- ✅ Cover happy path and error cases
- ✅ Mock external services (Supabase, APIs)

---

## 🚫 Forbidden Practices

- ❌ Direct console output in tests without mocking
- ❌ Hardcoded credentials or sensitive data
- ❌ Database operations without proper error handling
- ❌ Client-side authentication logic (auth is server-only)
- ❌ Skipping or modifying RLS policies without justification
- ❌ Pushing code that fails any quality check

---

## 📝 Commit Messages

Format:
```
type(scope): description

- Detail 1
- Detail 2
- Detail 3

Co-Authored-By: GitHub Copilot <copilot@github.com>
```

**Types:** feat, fix, refactor, docs, test, perf, chore

---

## 🔗 Dependencies & Integration

### External Services
- **Supabase**: Authentication, database, real-time updates
- **Stripe**: Payment processing (future)
- **Email**: Resend for transactional emails

### Important Files
- `lib/supabase-server.ts` - Server-side Supabase client
- `lib/auth-middleware.ts` - Authentication helpers
- `lib/admin-middleware.ts` - Admin authorization

---

## ✅ Verification Checklist

Before suggesting any PR:
- [ ] Code passes: `npm run lint`
- [ ] Code passes: `npx tsc --noEmit`
- [ ] Tests pass: `npm test`
- [ ] Commit message follows format
- [ ] No secrets or credentials exposed
- [ ] Tests cover main functionality
- [ ] Error handling is present

---

## 🎓 Key Architecture Patterns

### Authentication Flow
1. User authenticates via Supabase Auth
2. Session stored in Supabase
3. Server middleware validates session
4. Authorized endpoints process request

### Database Access
- Use Supabase client with proper RLS
- Admin operations use special admin client
- Always validate user permissions server-side

### Real-time Updates
- Subscribe to postgres_changes via Supabase
- Use proper filters (user_id, table, etc)
- Handle connection failures gracefully

---

## 📚 Reference

- `.claude-code-guidelines.md` - Claude Code specifics
- `.github/workflow/` - CI/CD configuration
- `docs/` - Architecture and implementation guides

---

**Generated for: GitHub Copilot**
**Last Updated: 2025-12-29**

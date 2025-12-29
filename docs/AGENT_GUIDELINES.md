# AI Agent Development Guidelines

**Complete reference for all AI coding agents working on imageLingo**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Development Workflow](#development-workflow)
4. [Code Quality Standards](#code-quality-standards)
5. [Testing Strategy](#testing-strategy)
6. [Architecture Patterns](#architecture-patterns)
7. [Security Guidelines](#security-guidelines)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### For First-Time Agents

1. **Understand the project**: Read `PROJECT_STRUCTURE.md`
2. **Know the standards**: Read `.agent.md`
3. **Clone & setup**:
   ```bash
   git clone <repo>
   npm install
   ```

4. **Verify your environment**:
   ```bash
   npm run lint      # Check code style
   npx tsc --noEmit # Check types
   npm test          # Run tests
   ```

5. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Make changes** following guidelines below

7. **Before pushing**:
   ```bash
   npm run lint && npx tsc --noEmit && npm test
   git add .
   git commit -m "type: description"
   git push origin feature/your-feature-name
   ```

---

## Project Overview

### Tech Stack
- **Framework**: Next.js 16+ (React 19)
- **Language**: TypeScript (strict mode required)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth)
- **State**: React Context + Hooks
- **Testing**: Vitest + React Testing Library
- **API**: Next.js API Routes

### Core Features
- User authentication (Supabase)
- Image processing with AI
- Multi-language support
- Real-time updates
- Admin dashboard
- Token-based credit system

### Key Libraries
```json
{
  "next": "16.0.7",
  "react": "19.0.0",
  "typescript": "^5.x",
  "tailwindcss": "^4.x",
  "@supabase/supabase-js": "^2.x",
  "vitest": "^2.x"
}
```

---

## Development Workflow

### Phase 1: Planning
- [ ] Understand the requirement
- [ ] Check if similar code exists
- [ ] Plan file structure and changes
- [ ] Identify dependencies

### Phase 2: Implementation
- [ ] Write TypeScript with proper types
- [ ] Follow code style standards
- [ ] Add JSDoc comments
- [ ] Implement error handling
- [ ] Add logging for important actions

### Phase 3: Testing
- [ ] Write unit tests first (or alongside code)
- [ ] Test happy path
- [ ] Test error cases
- [ ] Mock external dependencies
- [ ] Run full test suite

### Phase 4: Quality Assurance
- [ ] Run ESLint: `npm run lint`
- [ ] Run TypeScript: `npx tsc --noEmit`
- [ ] Run tests: `npm test`
- [ ] Manual testing if needed

### Phase 5: Submission
- [ ] Create meaningful commit message
- [ ] Push to feature branch
- [ ] Create Pull Request with description
- [ ] Wait for CI/CD and review

---

## Code Quality Standards

### ESLint Configuration
- Uses `@typescript-eslint/recommended`
- Requires proper import/export syntax
- No unused variables
- No implicit any types
- Exhaustive dependency arrays

**Fix command**: `npm run lint -- --fix`

### TypeScript Settings
- `strict: true` - All strictness flags enabled
- `noImplicitAny: true` - No implicit any
- `strictNullChecks: true` - Null/undefined checks
- `strictFunctionTypes: true` - Function type checking

**Verify**: `npx tsc --noEmit`

### Naming Conventions
```typescript
// Files and folders
MyComponent.tsx          // Components (PascalCase)
useCustomHook.ts        // Hooks (camelCase)
utils.ts                // Utilities (camelCase)
types.ts                // Type definitions (camelCase)

// Variables and functions
const userName = '...'; // Variables (camelCase)
const CONSTANT = '...'; // Constants (UPPER_SNAKE_CASE)
function doSomething()  // Functions (camelCase)
interface UserData {}   // Interfaces (PascalCase)
type Status = '...';    // Types (PascalCase)

// React Components
const MyButton = () => {}; // Components (PascalCase)
```

---

## Testing Strategy

### Test File Location
```
src/
  components/MyComponent.tsx
  __tests__/
    components/
      MyComponent.test.tsx   # Same name + .test.tsx
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  it('should do something specific', async () => {
    // Arrange
    const input = createInput();

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toEqual(expectedValue);
  });

  it('should handle error case', async () => {
    // Arrange
    vi.mocked(externalFunction).mockRejectedValue(new Error('Failed'));

    // Act & Assert
    await expect(functionUnderTest()).rejects.toThrow('Failed');
  });
});
```

### Test Coverage Goals
- **New Features**: Minimum 70%
- **Bug Fixes**: Minimum 80%
- **Critical Paths**: 90%+

---

## Architecture Patterns

### Authentication Flow
```
User Action → Authentication Check → Validate Session → Return Result
```

**Key Files**:
- `lib/auth-middleware.ts` - Regular user auth
- `lib/admin-middleware.ts` - Admin-only auth

### API Route Pattern
```typescript
export async function POST(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.required) {
      return Response.json({ error: 'Missing field' }, { status: 400 });
    }

    const result = await processRequest(userId, body);
    return Response.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Security Guidelines

### 1. Input Validation
- Validate all user inputs server-side
- Check type and format before processing
- Return 400 Bad Request for invalid input

### 2. Authentication
- Always check auth in server-side routes
- Never implement auth client-side
- Use middleware for consistent checking

### 3. Authorization
- Verify user owns resource before accessing
- Check admin status for admin endpoints
- Enforce Row Level Security (RLS) in database

### 4. Secrets Management
- Use environment variables for secrets
- Never hardcode API keys
- Never commit credentials

### 5. Error Handling
- Log errors server-side with details
- Return generic messages to client
- Never expose internal errors to user

---

## Troubleshooting

### Common Issues

#### ESLint Errors
```
Error: "x is declared but never used"
→ Solution: Remove unused variable

Error: "Any type"
→ Solution: Add proper type annotation
```

#### TypeScript Errors
```
Error: "Type 'X' is not assignable to type 'Y'"
→ Solution: Check type definitions, ensure proper typing
```

#### Test Failures
```
Error: "Expected X but got Y"
→ Solution: Check test data, verify assertions
```

---

## Useful Commands

```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server
npm run lint                   # Run ESLint
npm run lint -- --fix          # Auto-fix issues
npx tsc --noEmit              # Type check
npm test                       # Run tests
npm test -- --coverage        # Coverage report
npm test -- --watch           # Watch mode
```

---

**Last Updated: 2025-12-29**
**For all AI agents working on imageLingo**

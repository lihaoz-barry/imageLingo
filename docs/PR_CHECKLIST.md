# Pull Request Pre-Submission Checklist

## ⚠️ CRITICAL: Run these checks before pushing to GitHub!

Before creating or updating any Pull Request, you **MUST** run these tests locally and verify all pass. This prevents wasting time on CI/CD failures.

---

## 🔍 Pre-Push Testing Checklist

### 1. **ESLint (Code Quality)**
```bash
npm run lint
```
**Expected Result:** ✅ Should show `✖ X problems (0 errors, X warnings)`
- **FAILS if:** You see "error" in the output
- **Action:** Fix any errors before pushing

**What it checks:**
- Code style consistency
- Type safety for TypeScript code
- Unused variables and imports
- React best practices

### 2. **TypeScript Compilation**
```bash
npx tsc --noEmit
```
**Expected Result:** ✅ No output (clean exit with exit code 0)
- **FAILS if:** You see compilation errors
- **Action:** Fix type errors before pushing

**What it checks:**
- Type safety across all TypeScript files
- Missing type annotations
- Type mismatches

### 3. **Unit Tests**
```bash
npm test
```
**Expected Result:** ✅ `Test Files [X] passed` and `Tests [X] passed`
- **FAILS if:** You see ❌ or `failed` in output
- **Action:** Debug and fix failing tests before pushing

**What it checks:**
- All unit tests pass
- Component rendering works correctly
- API logic is sound
- Edge cases are handled

---

## 📋 Complete Pre-Push Workflow

Run this command sequence before pushing:

```bash
# 1. Run all three checks
npm run lint && npx tsc --noEmit && npm test

# 2. If all pass, you can safely push
git push origin <your-branch-name>

# 3. Create PR on GitHub
```

### ✅ Success Checklist:
- [ ] `npm run lint` - 0 errors
- [ ] `npx tsc --noEmit` - passes silently
- [ ] `npm test` - all tests pass
- [ ] Code committed with descriptive message
- [ ] Branch pushed to remote

### ❌ Failure Checklist:
If any test fails:
1. **DO NOT PUSH** to GitHub yet
2. Fix the error locally
3. Rerun the failing test
4. Repeat until all pass
5. **Then** commit and push

---

## 🚨 Common Errors and Fixes

### ESLint Error: "Unexpected any"
```
error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```
**Fix:** Replace `as any` with proper type:
```typescript
// ❌ Wrong
const x = value as any;

// ✅ Correct
const x = value as ReturnType<typeof vi.fn>;
```

### TypeScript Error: "Type not assignable"
```
error TS2322: Type 'X' is not assignable to type 'Y'
```
**Fix:** Check type definitions match function signatures

### Test Failure: "Unable to find element"
```
TestingLibraryElementError: Unable to find an element with the text
```
**Fix:**
- Use `screen.queryAllByText()` instead of `getByText()` for multiple matches
- Check HTML structure changed in component
- Update test selectors to match actual rendered output

---

## 📊 GitHub Actions CI/CD Pipeline

The remote GitHub repository runs these same checks:
1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test`

**If you follow this local checklist, GitHub Actions will pass automatically!**

---

## 🔄 Git Workflow with Testing

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Before pushing, run tests
npm run lint && npx tsc --noEmit && npm test

# If all pass ✅
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Create PR on GitHub
# GitHub Actions will verify again (should all pass)
```

---

## 💡 Pro Tips

1. **Run tests frequently** during development, not just at the end
2. **Fix errors immediately** - they compound over time
3. **Use `npm run lint -- --fix`** to auto-fix some ESLint issues
4. **Keep test files organized** - one test file per component/API route
5. **Mock external APIs** in tests to avoid network calls

---

## 📝 Notes

- These checks must **ALL** pass before pushing
- GitHub Actions will reject any PR that fails these checks
- This prevents wasted CI/CD cycles and review time
- All new features should include tests

**Remember:** Local testing = Faster PR reviews = Faster merges! 🚀

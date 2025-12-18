# Agent Prompt: Fix Critical Build Errors

**Branch to use:** Create a new branch from `main` with prefix `claude/fix-build-errors-{SESSION_ID}`

**Scope:** Fix 3 critical build errors preventing compilation. Do NOT modify any business logic, API endpoints, or features.

---

## Context

The em-ai-ecosystem project has 3 critical build errors that prevent `npm run build` from completing. These are isolated syntax/configuration issues that can be fixed without affecting other parts of the codebase.

**Other agents may be working on:**
- Documentation updates
- New feature development
- Test improvements
- Security hardening

**To avoid conflicts:**
- Only modify the 3 specific files listed below
- Do not modify any files in `packages/api/src/` except `tsconfig.json`
- Do not modify any dashboard components except `InteractionView.tsx`
- Do not modify any mobile files except `tsconfig.json`
- Commit with clear, descriptive messages

---

## Task 1: Fix Dashboard InteractionView.tsx (JSX Syntax Error)

**File:** `packages/dashboard/src/emotional-hub/InteractionView.tsx`

**Problem:** Line 133 has incorrect JSX closing tag. The code has nested `motion.div` inside `AnimatePresence`, but line 133 closes with `</AnimatePresence>` instead of `</motion.div>`.

**Current structure (buggy):**
```tsx
return (
    <AnimatePresence>           // Line 57 - opens outer AnimatePresence
      {feature && (
        <motion.div ...>        // Line 59 - opens outer motion.div
          <motion.div ...>      // Line 66 - opens inner motion.div
            ...
          </motion.div>         // Line 132 - closes inner motion.div
        </AnimatePresence>      // Line 133 - BUG: should be </motion.div>
      )}
    </AnimatePresence>          // Line 135 - closes outer AnimatePresence
  );
```

**Fix:** Change line 133 from `</AnimatePresence>` to `</motion.div>`

**Verification:** After fix, the JSX structure should be:
- `<AnimatePresence>` (line 57) closes at line 135
- Outer `<motion.div>` (line 59) closes at line 133
- Inner `<motion.div>` (line 66) closes at line 132

---

## Task 2: Fix Mobile tsconfig.json (moduleResolution Conflict)

**File:** `packages/mobile/tsconfig.json`

**Problem:** The config extends `expo/tsconfig.base` which sets `moduleResolution: "bundler"` and `customConditions: ["react-native"]`. The local config overrides with `moduleResolution: "node"`, causing the inherited `customConditions` to become invalid.

**Error message:**
```
Option 'customConditions' can only be used when 'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'.
```

**Fix:** Remove the `"moduleResolution": "node"` line from the local tsconfig. The expo base config will provide the correct value.

**Current (lines 10-11):**
```json
    "strict": true,
    "moduleResolution": "node",
```

**After fix (remove line 11):**
```json
    "strict": true,
```

**Alternative fix (if removing causes other issues):** Change to `"moduleResolution": "bundler"` to match expo base.

---

## Task 3: Fix API tsconfig.json (Jest Types Not Found)

**File:** `packages/api/tsconfig.json`

**Problem:** The `types: ["node", "jest"]` array references jest types, but they aren't being resolved in the npm workspace structure. Since tests are excluded from compilation anyway (`"exclude": ["node_modules", "dist", "tests/**/*"]`), jest types aren't needed for the build.

**Fix:** Remove `"jest"` from the types array.

**Current (line 6):**
```json
    "types": ["node", "jest"],
```

**After fix:**
```json
    "types": ["node"],
```

---

## Verification Steps

After making all 3 fixes, run:

```bash
# Install dependencies (skip puppeteer download to avoid network issues)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Build all packages
npm run build
```

**Expected output:** All 4 packages should build successfully:
- @em/orchestrator ✅
- @em/api ✅
- @em/dashboard ✅
- @em-ai/mobile ✅

---

## Commit Strategy

Make **one commit per fix** with clear messages:

```bash
# After Task 1
git add packages/dashboard/src/emotional-hub/InteractionView.tsx
git commit -m "fix(dashboard): correct JSX closing tag in InteractionView

The AnimatePresence/motion.div nesting had incorrect closing tag on line 133.
Changed </AnimatePresence> to </motion.div> to match the opening tag."

# After Task 2
git add packages/mobile/tsconfig.json
git commit -m "fix(mobile): resolve moduleResolution conflict with expo base config

Removed moduleResolution override that conflicted with expo/tsconfig.base
customConditions setting. Expo base provides bundler resolution."

# After Task 3
git add packages/api/tsconfig.json
git commit -m "fix(api): remove jest from types array in tsconfig

Jest types not needed for build since tests are excluded from compilation.
Fixes 'Cannot find type definition file for jest' error."
```

---

## Safety Checklist

Before pushing, verify:

- [ ] Only the 3 specified files were modified
- [ ] No business logic was changed
- [ ] `npm run build` completes successfully
- [ ] No new errors introduced
- [ ] Git status shows only the expected changes

---

## Do NOT:

- Modify any other files
- Change API endpoints or routes
- Modify React components (except the JSX tag fix)
- Update dependencies in package.json
- Change database schemas
- Modify Docker configuration
- Touch any `.env` files

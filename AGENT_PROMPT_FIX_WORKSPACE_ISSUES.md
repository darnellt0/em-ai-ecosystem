# Agent Prompt: Fix npm Workspace and Build Configuration Issues

**Branch to use:** Create a new branch from `main` with prefix `claude/fix-workspace-issues-{SESSION_ID}`

**Scope:** Fix npm workspace hoisting, TypeScript configuration, and monorepo package boundary issues to achieve a successful `npm run build`.

**Prerequisites:** The following fixes have already been applied on branch `claude/project-assessment-PSB3K`:
- InteractionView.tsx JSX closing tag corrected
- mobile/tsconfig.json simplified (removed module/moduleResolution overrides)
- api/tsconfig.json types array removed
- tailwindcss added to root package.json

---

## Context

This is a Lerna + npm workspaces monorepo with 4 packages:
- `@em/api` - Express REST API
- `@em/dashboard` - Next.js 14 web dashboard
- `@em-ai/mobile` - React Native + Expo mobile app
- `@em/orchestrator` - Shared intent classification utilities

The build currently fails due to:
1. **Dashboard**: tailwindcss not found by Next.js webpack worker
2. **Mobile**: @types/react not resolved, implicit any errors
3. **API**: Files from @em/daily-brief outside rootDir

---

## Task 1: Fix Dashboard tailwindcss Resolution

**Problem:** Next.js worker process cannot find tailwindcss despite it being in package.json.

**Root Cause:** npm workspaces hoisting behavior + Next.js spawns separate worker processes that don't inherit node resolution from parent.

**Solution:** Create `.npmrc` to control hoisting and ensure dashboard dependencies are properly resolved.

**Step 1.1:** Create/update `.npmrc` at workspace root:
```bash
# File: /home/user/em-ai-ecosystem/.npmrc
```
```ini
# Ensure all packages are hoisted to root node_modules
hoist=true
shamefully-hoist=true
```

**Step 1.2:** Verify dashboard package.json has tailwindcss in devDependencies (already done per system reminder - tailwindcss: "3.4.3")

**Step 1.3:** Clean and reinstall:
```bash
rm -rf node_modules package-lock.json packages/*/node_modules
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

**Step 1.4:** Verify tailwindcss is in root node_modules:
```bash
ls node_modules/tailwindcss
```

**Alternative if above doesn't work:** Install tailwindcss globally for the build process or use nohoist configuration.

---

## Task 2: Fix Mobile @types/react Resolution

**Problem:** TypeScript can't find type declarations for React in the mobile package.

**Error:**
```
Could not find a declaration file for module 'react'
```

**Root Cause:** The mobile package extends `expo/tsconfig.base` which has different module resolution settings. The @types/react might be in a different location than expected.

**Solution:** Add @types/react explicitly to mobile package and configure skipLibCheck.

**Step 2.1:** Add @types/react to mobile package:
```bash
npm install @types/react @types/react-native -w @em-ai/mobile --save-dev
```

**Step 2.2:** Update `packages/mobile/tsconfig.json` to include types:
```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": ["esnext", "dom", "dom.iterable"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "strict": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@styles/*": ["src/styles/*"]
    }
  },
  "extends": "expo/tsconfig.base",
  "include": [
    "src/**/*",
    "App.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

**Key changes:**
- Set `"strict": false` to allow implicit any temporarily
- Ensure `"skipLibCheck": true` is present
- Remove moduleResolution override (let expo base provide it)

**Step 2.3:** If errors persist, add type declarations file:
Create `packages/mobile/src/types/react.d.ts`:
```typescript
declare module 'react';
declare module 'react-native';
```

---

## Task 3: Fix API rootDir Conflict with daily-brief

**Problem:** API imports from `@em/daily-brief` which is a workspace symlink. TypeScript complains files are outside rootDir.

**Error:**
```
File '/home/user/em-ai-ecosystem/packages/agents/daily-brief/src/types.ts' is not under 'rootDir'
```

**Root Cause:** The API tsconfig has `rootDir: "./src"` but imports files from `../agents/daily-brief/src/`.

**Solution Options (choose one):**

### Option A: Use TypeScript Project References (Recommended)

**Step 3.1:** Update `packages/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@em/orchestrator": ["../orchestrator/src/index"],
      "@em/orchestrator/*": ["../orchestrator/src/*"],
      "@em/daily-brief": ["../agents/daily-brief/src/index"],
      "@em/daily-brief/*": ["../agents/daily-brief/src/*"]
    },
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests/**/*"],
  "references": [
    { "path": "../orchestrator" },
    { "path": "../agents/daily-brief" }
  ],
  "ts-node": {
    "esm": false,
    "transpileOnly": true
  }
}
```

**Step 3.2:** Update `packages/agents/daily-brief/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3.3:** Update `packages/orchestrator/tsconfig.json` similarly with `"composite": true`.

### Option B: Remove rootDir Restriction (Simpler but less clean)

**Step 3.1:** Update `packages/api/tsconfig.json` - remove rootDir and adjust outDir:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "."
  },
  "include": ["src/**/*", "../agents/daily-brief/src/**/*", "../orchestrator/src/**/*"],
  "exclude": ["node_modules", "dist", "tests/**/*"],
  "ts-node": {
    "esm": false,
    "transpileOnly": true
  }
}
```

---

## Task 4: Add .next to .gitignore

**Problem:** Build artifacts from Next.js are being tracked in git.

**Solution:** Add to `.gitignore`:

```bash
echo -e "\n# Next.js build output\n.next/\nout/" >> .gitignore
```

---

## Verification Steps

After all fixes, run:

```bash
# Clean install
rm -rf node_modules package-lock.json packages/*/node_modules
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

Make commits after each successful task:

```bash
# After Task 1
git add .npmrc package-lock.json
git commit -m "fix(workspace): add npmrc for proper dependency hoisting"

# After Task 2
git add packages/mobile/
git commit -m "fix(mobile): resolve @types/react and TypeScript configuration"

# After Task 3
git add packages/api/tsconfig.json packages/agents/daily-brief/tsconfig.json packages/orchestrator/tsconfig.json
git commit -m "fix(api): configure TypeScript project references for monorepo"

# After Task 4
git add .gitignore
git commit -m "chore: add .next to gitignore"

# Final verification commit
git commit --allow-empty -m "build: verify all packages compile successfully"
```

---

## Troubleshooting

### If tailwindcss still not found:
```bash
# Install directly in dashboard workspace
cd packages/dashboard
npm install tailwindcss@3.4.3 postcss autoprefixer --save-dev
cd ../..
npm install
```

### If mobile types still fail:
```bash
# Check where @types/react is installed
npm ls @types/react
# Force install in mobile
npm install @types/react@18.3.2 -w @em-ai/mobile --save-dev --force
```

### If API rootDir still fails:
- Use `transpileOnly: true` in ts-node config
- Build daily-brief first: `npm run build -w @em/daily-brief`
- Then build API: `npm run build -w @em/api`

---

## Do NOT:

- Modify business logic or API endpoints
- Change database schemas
- Modify Docker configuration
- Touch `.env` files
- Remove existing functionality
- Change package versions unless necessary for compatibility

---

## Success Criteria

- [ ] `npm run build` completes without errors
- [ ] All 4 packages compile successfully
- [ ] No TypeScript errors in any package
- [ ] Git status is clean (no untracked build artifacts)

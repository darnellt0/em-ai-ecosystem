# Testing

Unit tests (default, no external services required):
```
npm -w packages/api test
```

Integration tests (optional, may require infra or external services):
```
npm -w packages/api test:integration
```

Environment flags:
- EM_ENABLE_VOICE=true to mount voice API routes in `packages/api/src/index.ts`.
- ENABLE_GROWTH_AGENTS=true to enable growth-agent routes.

Dev server on port 3001:
```
$env:PORT=3001; npm -w packages/api run dev
```

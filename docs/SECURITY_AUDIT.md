# Security Audit Log Template

Use this document to track npm audit findings and mitigations.

- **Package**:
- **Severity**: (high/critical)
- **Advisory ID / Link**:
- **Runtime vs Dev-only**:
- **Detected On**:
- **Status**: (open/in-progress/resolved)
- **Mitigation / Fix plan**:
- **Target fix version/date**:
- **Notes**:

Run locally:
```bash
npm ci
npm audit --audit-level=high
```

CI: `.github/workflows/security.yml` runs weekly and on-demand.

# Database migrations (API)

- Files live in `packages/api/migrations` and are applied in filename order.
- Tracking table: `schema_migrations` with `filename` (PK) and `applied_at`.
- Run locally: `DATABASE_URL=postgres://user:pass@localhost:5432/db npm run db:migrate`.
- Re-running is safe; previously applied files are skipped.
- Add new migrations as `YYYYMMDDHHMMSS_description.sql` to preserve ordering.

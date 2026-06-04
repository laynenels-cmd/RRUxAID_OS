# Launch Runbook

## Current Launch Gate

The repository is ready for an internal pilot when these commands pass locally or in CI:

```bash
npm ci
npm run typecheck
npm run lint
npm run audit:known
npm run build
npm run test
```

`npm run test` runs:

- `test:roles`: verifies the admin/operator/viewer/partner permission contract.
- `test:smoke`: starts the production build with `next start`, verifies `/api/health`, unauthenticated redirects, demo login, dashboard render, reports navigation, mobile nav, and browser console health.

## Production Environment

Set these values in Vercel before the first production deploy:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
LLM_PROVIDER=openai
NEXT_PUBLIC_APP_MODE=internal
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not add it to any `NEXT_PUBLIC_` variable.

## Supabase Setup

1. Select or create the Supabase project intended for this app.
2. Run `supabase/migrations/202606020001_revenue_infrastructure_os.sql`.
3. Confirm `reports` exists in Storage. The migration creates it when permissions allow.
4. Create an admin auth user.
5. Run `npm run seed` with either:

```bash
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD='replace-with-a-strong-password' \
SEED_ADMIN_NAME='AID Admin' \
npm run seed
```

or:

```bash
SEED_ADMIN_USER_ID='00000000-0000-0000-0000-000000000000' npm run seed
```

6. Create operator/viewer/partner profile rows as needed.
7. Use Settings -> Partner Access as an admin to grant partner users access to specific athletes.
8. Run Supabase security and performance advisors after migration.

## Vercel Deployment

1. Push the repo to GitHub.
2. Create a Vercel project from the repo.
3. Add the production environment variables.
4. Deploy.
5. Check `/api/health` on the production domain.
6. Confirm `/dashboard` redirects signed-out users to `/login`.

## Live QA Matrix

Run this after the production Supabase project is configured:

- Admin: login, dashboard, athlete create/edit/archive, diagnostics, offers, buildouts, pipeline, reports, export/import, partner grants.
- Operator: login, all write workflows except admin-only import and partner grants.
- Viewer: login, read-only operational screens, write controls disabled or rejected.
- Partner: login, only partner-safe navigation, assigned athlete dossiers, approved reports, report PDF export.
- Anonymous: protected pages redirect to login, protected APIs return `401`.

## Dependency Audit

`npm run audit:known` currently permits only the tracked moderate Next/PostCSS advisory:

- `GHSA-qx2v-qp2m-jg93`

Do not use `npm audit fix --force` for this advisory because npm currently suggests an unsafe Next downgrade. When Next ships a safe patched version, upgrade Next and remove the allowlist.

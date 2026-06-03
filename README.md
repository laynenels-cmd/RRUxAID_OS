# RRU x AID Revenue Infrastructure OS

Internal operating system for the RRU x AID partnership team to manage athlete revenue infrastructure: athlete dossiers, revenue diagnostics, offers, buildouts, pipeline, reports, and the OS Agent.

The app migrated the standalone HTML prototype into a maintainable Next.js application with a premium dark operator UI, Supabase-backed live mode, and an honest local demo mode for evaluation without external services.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row Level Security
- OpenAI API through a provider-isolated agent service
- Zod validation and React Hook Form
- Lightweight server-side CSV and PDF export
- Vercel-compatible deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With the default `.env.example` values and no Supabase credentials, the app runs in local demo mode. Use **Continue in Demo Mode** on the login screen.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
LLM_PROVIDER=openai
NEXT_PUBLIC_APP_MODE=internal
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code. It is only used on the server for seed/reset/storage operations.

## Supabase Setup

1. Create a Supabase project.
2. Copy project URL and anon key into `.env.local`.
3. Copy the service role key into `.env.local` for server-only admin tasks.
4. Run the migration SQL in `supabase/migrations/202606020001_revenue_infrastructure_os.sql`.
5. Confirm the `reports` storage bucket exists. The migration creates it when permissions allow.
6. Create an admin user through Supabase Auth, or let the seed script create one with the variables below.

### Seed Data

Option A, create or reuse an admin auth user:

```bash
SEED_ADMIN_EMAIL=admin@rru-aid.internal \
SEED_ADMIN_PASSWORD='replace-with-a-strong-password' \
SEED_ADMIN_NAME='AID Admin' \
npm run seed
```

Option B, attach seed records to an existing auth user:

```bash
SEED_ADMIN_USER_ID='00000000-0000-0000-0000-000000000000' npm run seed
```

The seed includes Nico Ramirez, Marcus King, Devon Price, Isaiah Brooks, Jalen Torres, Adrian Cole, diagnostics, offers, buildouts, tasks, pipeline deals, saved reports, and activity logs.

## Running And Building

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run start
```

## User Roles

- `admin`: full read/write access, team settings, demo reset, import/export.
- `operator`: read/write operational athlete, diagnostic, offer, buildout, pipeline, report, and agent records.
- `viewer`: read-only internal access.
- `partner`: limited read access to explicitly allowed athlete records and approved reports.

Anonymous users are redirected to login and cannot access application data.
Partner API access is intentionally limited to athlete/report read surfaces; diagnostics, offers, buildouts, pipeline, imports, seed reset, and cohort exports remain internal.

## Demo Mode Vs Live Mode

Demo mode is enabled when `NEXT_PUBLIC_DEMO_MODE` is not `false` and Supabase is not configured. It persists to `.local-demo/rru-aid-os.json` on your machine and labels agent fallback responses as Prototype Mode when no OpenAI key is present.

Live mode is active when Supabase URL and anon key are configured. Data is stored in Supabase Postgres and protected by RLS. PDF report storage requires `SUPABASE_SERVICE_ROLE_KEY`.

## Core Workflows

- Dashboard: database-derived KPIs, pipeline totals, readiness leader, next action, and recent activity.
- Athlete Intelligence: search, filter, sort, create, edit, archive, and open athlete dossiers.
- Athlete Dossier: identity, summaries, trust signals, assets, leaks, opportunities, diagnostics, offers, buildout, pipeline, reports, and activity.
- Diagnostics: create/run deterministic scoring from saved data, persist scores, update readiness, edit and approve.
- Offer Architect: create/edit offers, submit for review, approve, deploy, and create buildout tasks.
- Ownership Map: strategic planning view generated from athlete, offer, buildout, and opportunity data.
- Buildouts: persisted stage advancement, blocked/complete status, task creation, assignment, and completion.
- Pipeline: create/edit deals, update stages, weighted value, AID/RRU split, and CSV export.
- Reports: generate saved reports from app data, preview, approve, export/download PDF, and store PDF path when storage is configured.
- OS Agent: authenticated API endpoint loads saved app context, calls OpenAI when configured, saves messages, logs activity, and falls back deterministically without an API key.
- Settings/Data Room: profile, role, team list, connection status, demo seed/reset, JSON import/export, and pipeline CSV export.

## QA Checklist

- [x] `npm install`
- [x] `npm run dev`
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Login/logout
- [x] Protected route redirect
- [x] Dashboard loads database/demo-derived values
- [x] Athlete create/edit/view/archive
- [x] Diagnostic run/save/approve
- [x] Offer save/review/approve/deploy
- [x] Buildout advance persists after readback
- [x] Pipeline deal create/edit/export
- [x] Report generation/approval/PDF export
- [x] Agent API response and no-key fallback
- [x] Settings export/import/reset
- [x] Role restrictions: anonymous/demo API checks, explicit partner-read API boundaries, plus Supabase RLS policies in migration
- [x] Service role key is not exposed to client code
- [x] No visible primary action is knowingly dead
- [x] Responsive smoke at 1440px, 1024px, and mobile fallback

## Known Limitations

- The PDF exporter intentionally uses a simple server-side PDF renderer for stable internal exports. It is functional, but not a full design-grade typesetting engine.
- Partner access is enforced by RLS through `partner_athlete_access`; partner invitation and approval management UI is not yet expanded beyond the admin/team data model.
- Demo reset is local-only unless Supabase service role configuration is available.
- The OS Agent can recommend actions from saved context, but it does not autonomously mutate records.
- Storage upload depends on a configured Supabase project and service role key; downloads still work without storage.
- `npm install` currently reports two moderate dependency advisories. They are not blocking the verified build, and `npm audit fix --force` would introduce breaking upgrades.

## Deploying To Vercel

1. Push this repository to GitHub.
2. Create a Vercel project from the repo.
3. Add the environment variables listed above.
4. Run the Supabase migration before first production login.
5. Seed an admin user or create a profile row for an existing Supabase Auth user.
6. Deploy.

Recommended production values:

```bash
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_MODE=internal
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.example
```

## Future Roadmap

- Admin UI for partner access grants.
- Richer report templates and branded PDF layouts.
- Optional webhook integrations once concrete downstream systems are selected.
- More granular activity filters and operator workload views.
- Additional LLM providers behind the existing `lib/ai` boundary.

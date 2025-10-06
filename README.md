## FIGR – Web App

Mobile‑first personal finance manager built with React, TypeScript, Vite, Tailwind, shadcn/ui, and Supabase.

### Getting started

```bash
npm install
npm run dev
```

Build & preview:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

### Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui
- Supabase (Auth, PostgreSQL, Edge Functions)
- React Router, React Query

### Project structure

- `src/` – application code
  - `pages/` – routes (mobile variants `*Mobile.tsx`)
  - `components/` – UI and feature components
  - `integrations/supabase/` – client and types
  - `lib/` – utilities and finance helpers
- `supabase/` – config, Edge Functions, migrations

### Environment

Supabase keys are currently set in `src/integrations/supabase/client.ts`. Consider migrating to `.env` with Vite `import.meta.env` for production.

### Supabase Edge Functions

Functions live under `supabase/functions/`:
- `monthly-reconcile` – monthly budget reconciliation
- `apply-due-subscriptions` – create due subscription transactions
- `apply-scheduled-contributions` – apply goal contributions
- `apply-reconciliation-decision` – process user decisions

### Notes

- Development server port is configured in `vite.config.ts`.
- See repo root `README.md` and `CODEBASE_OVERVIEW.md` for full architecture and repo layout.

# Mercado

A phone-first grocery tracker for a single Household: a Pantry of Products grouped in Categories, and a shared Shopping List. The app's UI is in Spanish.

- Domain language: [CONTEXT.md](CONTEXT.md)
- Architecture decisions: [docs/adr/](docs/adr/)
- Spec and tickets: GitHub issue #1 and its sub-issues

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS + shadcn/ui · Drizzle ORM · Supabase Postgres · Vitest

Business rules live in a pure domain core under `src/domain/` (no database, framework, clock or environment access) and are the only code with automated tests. The database layer lives in `src/db/` and is only ever used from the server.

## Local development

### Prerequisites

- Node.js 24
- pnpm 11 (the exact version is pinned in `package.json`'s `packageManager`; `corepack enable` installs it)
- Docker Desktop, running

### First-time setup

1. Install dependencies:

   ```sh
   pnpm install
   ```

   Only `esbuild` and `unrs-resolver` are allowed to run install scripts (`allowBuilds` in `pnpm-workspace.yaml`); pnpm refuses any other package's scripts, so a new dependency that needs one must be approved with `pnpm approve-builds <package>`.

2. Create `.env.local` at the repository root with the local database connection strings and the sign-in configuration:

   ```sh
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   DIRECT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   PIN_HASH_SECRET=local-dev-only-pin-hash-secret-change-me
   FIRST_ADMIN_NAME=Admin
   FIRST_ADMIN_PIN=1234
   ```

   `DATABASE_URL` is used by the app at runtime; `DIRECT_DATABASE_URL` only by migrations. In hosted environments `DATABASE_URL` points at Supabase's pooler in transaction mode (port 6543) and `DIRECT_DATABASE_URL` at the pooler in session mode (port 5432); see [Deploying](#deploying).

   `PIN_HASH_SECRET` keys the HMAC-SHA256 used to hash every PIN before it is stored (ADR-0001); use a long random string in hosted environments. `FIRST_ADMIN_NAME` and `FIRST_ADMIN_PIN` configure the first Admin, created automatically the first time anyone signs in while the Household has no Users yet (no manual seed step). All three are server-only. `PIN_HASH_SECRET` is required and checked on every sign-in attempt; `FIRST_ADMIN_NAME` and `FIRST_ADMIN_PIN` are only read and validated while the Users table is still empty. Each fails fast with a clear error when it's needed but missing.

3. Start the local Supabase stack (only Postgres is enabled; the first run downloads the image):

   ```sh
   pnpm db:start
   ```

4. Apply the migrations, which also create the starting Categories:

   ```sh
   pnpm db:migrate
   ```

5. Start the app and open http://localhost:3000:

   ```sh
   pnpm dev
   ```

### Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the app |
| `pnpm test` | Run the unit tests once |
| `pnpm test:watch` | Run the unit tests in watch mode |
| `pnpm typecheck` | Type-check the project |
| `pnpm lint` | Lint the project |
| `pnpm db:generate --name <change>` | Generate a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:stop` | Stop the local Supabase stack |

Pass extra arguments straight after the script name. Unlike npm, pnpm forwards a `--` separator to the command literally, so `pnpm db:generate -- --name x` fails.

### Database rules

- Every table enables Row Level Security with no policies, so Supabase's public key can read or write nothing. Only the Next.js server, with a privileged connection, touches data.
- Schema changes go through Drizzle migrations in `drizzle/`; never edit the database by hand.
- Seed data is a migration too (`drizzle/0005_seed_starting_categories.sql`), so it runs exactly once per database and never re-creates Categories an Admin deleted.
- Write migrations that add rather than remove. Every deploy migrates before the new code goes live, and a failed build leaves the database one step ahead of the running code, so a rename or a dropped column should happen in two deploys: add the new form first, remove the old one once nothing uses it.

## Deploying

Vercel runs the `vercel-build` script, which applies pending migrations and then builds, so every deploy migrates its own database automatically: production migrates the production database, previews migrate staging. There is no manual migration or seed step.

Set these in Vercel, separately for **Production** (production Supabase project) and **Preview** (staging project). Leave **Development** empty; `.env.local` covers it.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase *Connect* → **Transaction pooler** (port 6543), with `?sslmode=require` |
| `DIRECT_DATABASE_URL` | Supabase *Connect* → **Session pooler** (port 5432), with `?sslmode=require` |
| `PIN_HASH_SECRET` | A long random string; keep a copy somewhere safe |
| `FIRST_ADMIN_NAME` | The first Admin's name |
| `FIRST_ADMIN_PIN` | The first Admin's 4-digit PIN |

- **Never change `PIN_HASH_SECRET` once anyone has signed in.** Every stored PIN is hashed with it, so a new secret locks out the whole Household.
- Use the **Session pooler** for `DIRECT_DATABASE_URL`, not the Direct connection: Supabase's direct connection is IPv6-only on the free plan, and Vercel's build machines (like most home networks) are IPv4, so it hangs instead of failing. Never point migrations at the Transaction pooler.
- Do not set `NODE_ENV` in Vercel: the build needs the development dependencies (`drizzle-kit`) installed.
- Set `ENABLE_EXPERIMENTAL_COREPACK=1` in Vercel so it installs with the exact pnpm pinned in `packageManager`. The lockfile format (`9.0`) is shared by pnpm 9, 10 and 11, so without it Vercel may pick a different pnpm than the one this project is tested with, and the `allowBuilds` setting in `pnpm-workspace.yaml` was written by pnpm 11.
- The first sign-in on a new database creates the first Admin. After that, `FIRST_ADMIN_PIN` is never read again and can be removed from Vercel.

## Known limitations

- The offline service worker (`public/sw.js`, ticket #17) behaves differently under `pnpm dev` than it's expected to in production. Under `next dev`, a hard reload of `/lista` while offline is served correctly from the worker's cache at the HTTP level, but React does not hydrate on that response (most likely Turbopack's dev/HMR client blocking client bootstrap while its WebSocket can't connect — there is no such client in a production build). Before shipping a change to the offline behaviour, check against a production build (`next build && next start`) that: the "Sin conexión..." banner appears immediately on a cold offline reload of `/lista` (not only once already-hydrated and then disconnected), and that tapping a Product still shows the Spanish refusal instead of doing nothing.

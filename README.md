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
- Docker Desktop, running

### First-time setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` at the repository root with the local database connection strings and the sign-in configuration:

   ```sh
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   DIRECT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   PIN_HASH_SECRET=local-dev-only-pin-hash-secret-change-me
   FIRST_ADMIN_NAME=Admin
   FIRST_ADMIN_PIN=1234
   ```

   `DATABASE_URL` is used by the app at runtime; `DIRECT_DATABASE_URL` by migrations and seeding. In hosted environments `DATABASE_URL` points at Supabase's pooler in transaction mode (port 6543) and `DIRECT_DATABASE_URL` at the direct connection.

   `PIN_HASH_SECRET` keys the HMAC-SHA256 used to hash every PIN before it is stored (ADR-0001); use a long random string in hosted environments. `FIRST_ADMIN_NAME` and `FIRST_ADMIN_PIN` configure the first Admin, created automatically the first time anyone signs in while the Household has no Users yet (no manual seed step). All three are server-only. `PIN_HASH_SECRET` is required and checked on every sign-in attempt; `FIRST_ADMIN_NAME` and `FIRST_ADMIN_PIN` are only read and validated while the Users table is still empty. Each fails fast with a clear error when it's needed but missing.

3. Start the local Supabase stack (only Postgres is enabled; the first run downloads the image):

   ```sh
   npm run db:start
   ```

4. Apply migrations and seed the starting Categories:

   ```sh
   npm run db:migrate
   npm run db:seed
   ```

   Seeding only inserts the starting Categories when the Household has none, so it is safe to run again.

5. Start the app and open http://localhost:3000:

   ```sh
   npm run dev
   ```

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run typecheck` | Type-check the project |
| `npm run lint` | Lint the project |
| `npm run db:generate -- --name <change>` | Generate a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed the starting Categories into an empty Household |
| `npm run db:stop` | Stop the local Supabase stack |

### Database rules

- Every table enables Row Level Security with no policies, so Supabase's public key can read or write nothing. Only the Next.js server, with a privileged connection, touches data.
- Schema changes go through Drizzle migrations in `drizzle/`; never edit the database by hand.

## Known limitations

- The offline service worker (`public/sw.js`, ticket #17) behaves differently under `npm run dev` than it's expected to in production. Under `next dev`, a hard reload of `/lista` while offline is served correctly from the worker's cache at the HTTP level, but React does not hydrate on that response (most likely Turbopack's dev/HMR client blocking client bootstrap while its WebSocket can't connect — there is no such client in a production build). Before shipping a change to the offline behaviour, check against a production build (`next build && next start`) that: the "Sin conexión..." banner appears immediately on a cold offline reload of `/lista` (not only once already-hydrated and then disconnected), and that tapping a Product still shows the Spanish refusal instead of doing nothing.

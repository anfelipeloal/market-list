# PIN-only authentication instead of Supabase Auth

Users sign in with a 4-digit PIN alone, assigned by an Admin, rather than with Supabase Auth (email, magic link or OAuth), even though the database is Supabase. The app serves a single Household on phones, where typing an email or password is friction nobody will tolerate for a grocery list, and Supabase Auth has no PIN-only flow.

## Considered Options

- **Supabase Auth**: rejected; every flow needs an email or phone identity, which is overkill for a Household and slow on a phone.
- **Pick your name, then enter a PIN**: rejected; it exposes the Household's names on the login screen and adds a tap for little security gain.
- **PIN only**: chosen.

## Consequences

- PINs must be unique within the Household, because the PIN is the only identifier.
- A 4-digit space is guessable. Failed attempts are limited per IP address (5 failures lock that IP out for 15 minutes) and globally (more than 30 failures in an hour pause all new sign-ins for an hour). Devices cannot be told apart reliably, so there is no per-device lockout.
- Sessions live server-side for 7 days so that removing a User or changing their PIN ends their sessions immediately. The global pause only blocks new sign-ins, never existing sessions.
- Admins can set PINs but never read them. PINs are stored as an HMAC-SHA256 keyed with a server-side secret that is never in the database: a plain or salted hash of a 4-digit value is reversed by trying all 10,000, and the keyed hash also allows a unique index and a direct lookup at sign-in.
- Database backups contain User names and PIN hashes, so they are encrypted before leaving the workflow that produces them.
- The browser never talks to Supabase directly: all database access goes through the Next.js server, and Row Level Security is enabled with no policies so the public key can reach nothing.

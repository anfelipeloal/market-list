// The canonical hyphenated form of an RFC 4122 UUID: 8-4-4-4-12 hex digits, case-insensitive, no
// surrounding characters. Every table's primary key is a `uuid` column (see src/db/schema.ts),
// so this is the id shape every by-id lookup and update must satisfy before it reaches the
// database: Postgres rejects anything else with `22P02 invalid input syntax for type uuid`, which
// must never surface to a User as a server error. A malformed id is treated exactly like an
// unknown one.
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidId(id: string): boolean {
  return ID_PATTERN.test(id);
}

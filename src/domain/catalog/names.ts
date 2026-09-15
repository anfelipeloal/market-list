const COMBINING_MARKS = /\p{Mn}/gu;

// The form a Category or Product name is stored in for display: trimmed and with internal
// whitespace collapsed, but capitalization and accents kept exactly as typed.
export function cleanDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeName(name: string): string {
  return stripAccents(cleanDisplayName(name).toLowerCase());
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

// Finds the entry, other than the one being renamed (identified by `id`), whose name matches
// `name`. Renaming an entry to a variant of its own name (e.g. fixing capitalization or an
// accent) must not be reported as a collision with itself, so callers exclude `id` rather than
// filtering by name alone.
export function findOtherWithMatchingName<T extends { id: string; name: string }>(
  items: readonly T[],
  id: string,
  name: string,
): T | undefined {
  return items.find((item) => item.id !== id && namesMatch(item.name, name));
}

export type NameCollisionResult<T> =
  | { outcome: "empty" }
  | { outcome: "duplicate"; existing: T }
  | { outcome: "valid"; name: string; normalizedName: string };

// Core name validation shared by creating and renaming a Category or a Product: clean the raw
// name, reject an empty result, then reject a collision with another entry of the same kind.
// `excludeId` is the entry being renamed, excluded from its own collision check (see
// findOtherWithMatchingName); creating passes null since there is no entry yet to exclude.
export function checkNameCollision<T extends { id: string; name: string }>(
  rawName: string,
  existingItems: readonly T[],
  excludeId: string | null,
): NameCollisionResult<T> {
  const name = cleanDisplayName(rawName);
  if (name === "") return { outcome: "empty" };

  const existing =
    excludeId === null
      ? existingItems.find((item) => namesMatch(item.name, name))
      : findOtherWithMatchingName(existingItems, excludeId, name);
  if (existing) return { outcome: "duplicate", existing };

  return { outcome: "valid", name, normalizedName: normalizeName(name) };
}

// Explicit locale: the server's default (e.g. en-US on Vercel) would sort ñ as an accented n.
const SPANISH = new Intl.Collator("es", { sensitivity: "base" });

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => SPANISH.compare(a.name, b.name));
}

// ñ is a letter of its own in Spanish ("año" is not "ano"), so it keeps its tilde.
function stripAccents(text: string): string {
  return Array.from(text.normalize("NFC"), (char) =>
    char === "ñ" ? char : char.normalize("NFD").replace(COMBINING_MARKS, ""),
  ).join("");
}

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

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

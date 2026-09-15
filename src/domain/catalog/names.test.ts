import { describe, expect, it } from "vitest";
import { cleanDisplayName, namesMatch, normalizeName, sortByName } from "./names";

describe("stored display name", () => {
  it("trims and collapses internal whitespace but keeps capitalization and accents", () => {
    expect(cleanDisplayName("  Leche   Deslactosada ")).toBe("Leche Deslactosada");
  });
});

describe("name matching", () => {
  it("treats names that differ only in capitalization as the same name", () => {
    expect(namesMatch("Leche", "leche")).toBe(true);
  });

  it("treats names that differ only in accents as the same name", () => {
    expect(namesMatch("Limón", "limon")).toBe(true);
  });

  it("treats names that differ only in surrounding or repeated spaces as the same name", () => {
    expect(namesMatch("  Lácteos   y huevos ", "Lácteos y huevos")).toBe(true);
  });

  it("keeps ñ as its own letter rather than an accented n", () => {
    expect(namesMatch("Piña", "Pina")).toBe(false);
    expect(namesMatch("PIÑA", "piña")).toBe(true);
  });

  it("treats singular and plural as different names", () => {
    expect(namesMatch("Tomate", "Tomates")).toBe(false);
  });

  it("normalizes a name to the form stored for uniqueness", () => {
    expect(normalizeName("  Lácteos   Y Huevos ")).toBe("lacteos y huevos");
  });
});

describe("A–Z ordering", () => {
  const named = (...names: string[]) => names.map((name) => ({ name }));

  it("lists Categories A–Z regardless of capitalization and accents", () => {
    const sorted = sortByName(named("Verduras", "aseo", "Lácteos y huevos", "Árboles", "Bebidas"));

    expect(sorted.map((c) => c.name)).toEqual(["Árboles", "aseo", "Bebidas", "Lácteos y huevos", "Verduras"]);
  });

  it("places ñ after n, as in the Spanish alphabet", () => {
    const sorted = sortByName(named("Olivas", "Ñame", "Nueces"));

    expect(sorted.map((c) => c.name)).toEqual(["Nueces", "Ñame", "Olivas"]);
  });
});

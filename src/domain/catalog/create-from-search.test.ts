import { describe, expect, it } from "vitest";
import { shouldOfferCreate, suggestCategoryId } from "./create-from-search";
import type { PantryCategory } from "./pantry";

const results: PantryCategory[] = [
  {
    id: "cat-lacteos",
    name: "Lácteos y huevos",
    products: [
      { id: "p1", name: "Leche entera" },
      { id: "p2", name: "Leche de almendras" },
    ],
  },
  { id: "cat-bebidas", name: "Bebidas", products: [{ id: "p3", name: "Leche de soya" }] },
];

describe("offering to create a Product from the search", () => {
  it("does not offer for empty or whitespace-only text", () => {
    expect(shouldOfferCreate("", results)).toBe(false);
    expect(shouldOfferCreate("   ", results)).toBe(false);
  });

  it("offers when only partial matches exist", () => {
    expect(shouldOfferCreate("leche", results)).toBe(true);
  });

  it("offers when there are no results at all", () => {
    expect(shouldOfferCreate("xyz", [])).toBe(true);
  });

  it("does not offer when a name matches exactly", () => {
    expect(shouldOfferCreate("Leche entera", results)).toBe(false);
  });

  it("ignores capitalization, accents and extra spaces when matching exactly", () => {
    const accented = [{ id: "c", name: "Frutas", products: [{ id: "p", name: "Limón" }] }];
    expect(shouldOfferCreate("  LIMON ", accented)).toBe(false);
    expect(shouldOfferCreate("leche   entera", results)).toBe(false);
  });

  it("treats plurals as different names", () => {
    expect(shouldOfferCreate("Leche enteras", results)).toBe(true);
  });

  it("treats ñ as different from n", () => {
    const anos = [{ id: "c", name: "Varios", products: [{ id: "p", name: "Año" }] }];
    expect(shouldOfferCreate("ano", anos)).toBe(true);
    expect(shouldOfferCreate("AÑO", anos)).toBe(false);
  });
});

describe("suggesting a Category for the new Product", () => {
  it("suggests the Category holding the most matches", () => {
    expect(suggestCategoryId(results)).toBe("cat-lacteos");
  });

  it("breaks ties with the first Category A-Z", () => {
    const tied = [
      { id: "cat-b", name: "Bebidas", products: [{ id: "a", name: "A" }] },
      { id: "cat-a", name: "Aseo", products: [{ id: "b", name: "B" }] },
      { id: "cat-l", name: "Lácteos", products: [{ id: "c", name: "C" }] },
    ];
    expect(suggestCategoryId(tied)).toBe("cat-a");
  });

  it("suggests nothing when there are no matches", () => {
    expect(suggestCategoryId([])).toBeUndefined();
    expect(suggestCategoryId([{ id: "c", name: "Aseo", products: [] }])).toBeUndefined();
  });
});

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
    expect(suggestCategoryId(results, results, "leche")).toBe("cat-lacteos");
  });

  it("breaks ties with the first Category A-Z", () => {
    const tied = [
      { id: "cat-b", name: "Bebidas", products: [{ id: "a", name: "A" }] },
      { id: "cat-a", name: "Aseo", products: [{ id: "b", name: "B" }] },
      { id: "cat-l", name: "Lácteos", products: [{ id: "c", name: "C" }] },
    ];
    expect(suggestCategoryId(tied, tied, "x")).toBe("cat-a");
  });

  it("suggests nothing when there are no matches", () => {
    expect(suggestCategoryId([], [], "xyz")).toBeUndefined();
    expect(suggestCategoryId([{ id: "c", name: "Aseo", products: [] }], [], "xyz")).toBeUndefined();
  });

  describe("when no Product contains the search text", () => {
    const pantry: PantryCategory[] = [
      { id: "cat-lacteos", name: "Lácteos y huevos", products: [{ id: "p1", name: "Leche" }] },
      { id: "cat-frutas", name: "Frutas", products: [{ id: "p2", name: "Limón" }] },
      { id: "cat-varios", name: "Varios", products: [{ id: "p3", name: "Sal" }] },
    ];

    it("falls back to Products whose every word appears in the search text", () => {
      expect(suggestCategoryId([], pantry, "Leche deslactosada")).toBe("cat-lacteos");
    });

    it("compares those words ignoring capitalization and accents", () => {
      expect(suggestCategoryId([], pantry, "LIMON tahiti")).toBe("cat-frutas");
    });

    it("matches whole words only, never fragments of a word", () => {
      expect(suggestCategoryId([], pantry, "salsa de tomate")).toBeUndefined();
    });

    it("prefers Products containing the search text over the fallback", () => {
      const containing = [{ id: "cat-bebidas", name: "Bebidas", products: [{ id: "p4", name: "Leche de soya" }] }];
      expect(suggestCategoryId(containing, pantry, "leche de so")).toBe("cat-bebidas");
    });
  });
});

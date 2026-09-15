import { describe, expect, it } from "vitest";
import type { PantryCategory } from "./pantry";
import { searchPantry } from "./search-pantry";

const pantry: PantryCategory[] = [
  {
    id: "cat-frutas",
    name: "Frutas",
    products: [
      { id: "prod-limon", name: "Limón" },
      { id: "prod-manzana", name: "Manzana" },
    ],
  },
  {
    id: "cat-verduras",
    name: "Verduras",
    products: [
      { id: "prod-acelga", name: "Acelga" },
      { id: "prod-cilantro", name: "Cilantro" },
    ],
  },
  {
    id: "cat-aseo",
    name: "Aseo",
    products: [],
  },
];

describe("searching the Pantry", () => {
  it("returns the full Pantry unchanged when the search text is empty", () => {
    expect(searchPantry(pantry, "")).toEqual(pantry);
  });

  it("returns the full Pantry unchanged when the search text is whitespace-only", () => {
    expect(searchPantry(pantry, "   ")).toEqual(pantry);
  });

  it("keeps only Products whose name contains the search text", () => {
    expect(searchPantry(pantry, "man")).toEqual([
      { id: "cat-frutas", name: "Frutas", products: [{ id: "prod-manzana", name: "Manzana" }] },
    ]);
  });

  it("matches regardless of capitalization", () => {
    expect(searchPantry(pantry, "CÍL")).toEqual([
      { id: "cat-verduras", name: "Verduras", products: [{ id: "prod-cilantro", name: "Cilantro" }] },
    ]);
  });

  it("matches regardless of accents", () => {
    expect(searchPantry(pantry, "limon")).toEqual([
      { id: "cat-frutas", name: "Frutas", products: [{ id: "prod-limon", name: "Limón" }] },
    ]);
  });

  it("matches regardless of extra or surrounding spaces in the search text", () => {
    const withDeslactosada: PantryCategory[] = [
      { id: "cat-lacteos", name: "Lácteos", products: [{ id: "prod-leche-des", name: "Leche Deslactosada" }] },
    ];

    expect(searchPantry(withDeslactosada, "  leche   des ")).toEqual(withDeslactosada);
  });

  it("keeps ñ as its own letter, so it does not match a search text with a plain n", () => {
    const withPina: PantryCategory[] = [{ id: "cat-frutas", name: "Frutas", products: [{ id: "prod-pina", name: "Piña" }] }];

    expect(searchPantry(withPina, "pina")).toEqual([]);
  });

  it("hides a Category once none of its Products match", () => {
    const result = searchPantry(pantry, "man");

    expect(result.map((c) => c.id)).not.toContain("cat-verduras");
    expect(result.map((c) => c.id)).not.toContain("cat-aseo");
  });

  it("hides a Category that has no Products at all while searching", () => {
    expect(searchPantry(pantry, "man").some((c) => c.id === "cat-aseo")).toBe(false);
  });

  it("returns no Categories when nothing matches", () => {
    expect(searchPantry(pantry, "xyz-no-existe")).toEqual([]);
  });

  it("keeps the A-Z order of the Categories and Products it received", () => {
    const wideMatch: PantryCategory[] = [
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [
          { id: "prod-limon", name: "Limón" },
          { id: "prod-manzana", name: "Manzana" },
        ],
      },
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [
          { id: "prod-acelga", name: "Acelga" },
          { id: "prod-cilantro", name: "Cilantro" },
        ],
      },
    ];

    // "a" matches at least one Product in both Categories; the result keeps the order it received.
    expect(searchPantry(wideMatch, "a").map((c) => c.id)).toEqual(["cat-frutas", "cat-verduras"]);
  });
});

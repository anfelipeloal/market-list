import { describe, expect, it } from "vitest";
import { validateCategoryRename } from "./rename-category";

const categories = [
  { id: "cat-frutas", name: "Frutas" },
  { id: "cat-lacteos", name: "Lácteos y huevos" },
];

describe("renaming a Category", () => {
  it("rejects an unknown Category", () => {
    expect(validateCategoryRename("cat-unknown", "Verduras", categories)).toEqual({ outcome: "notFound" });
  });

  it("rejects an empty name", () => {
    expect(validateCategoryRename("cat-frutas", "", categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateCategoryRename("cat-frutas", "   ", categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a name that collides with ANOTHER Category under name matching", () => {
    expect(validateCategoryRename("cat-frutas", "lacteos y huevos", categories)).toEqual({
      outcome: "duplicate",
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });

  it("allows renaming to a variant of its own name and updates the display name", () => {
    expect(validateCategoryRename("cat-lacteos", "lacteos y huevos", categories)).toEqual({
      outcome: "valid",
      id: "cat-lacteos",
      name: "lacteos y huevos",
      normalizedName: "lacteos y huevos",
    });
  });

  it("accepts a name that does not collide with any other Category", () => {
    expect(validateCategoryRename("cat-frutas", "Verduras", categories)).toEqual({
      outcome: "valid",
      id: "cat-frutas",
      name: "Verduras",
      normalizedName: "verduras",
    });
  });

  it("stores the cleaned display name: trimmed and with internal whitespace collapsed", () => {
    expect(validateCategoryRename("cat-frutas", "  Frutas   Frescas ", categories)).toEqual({
      outcome: "valid",
      id: "cat-frutas",
      name: "Frutas Frescas",
      normalizedName: "frutas frescas",
    });
  });
});

import { describe, expect, it } from "vitest";
import { validateNewCategory } from "./create-category";

describe("creating a Category", () => {
  it("rejects an empty name", () => {
    expect(validateNewCategory("", [])).toEqual({ outcome: "empty" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateNewCategory("   ", [])).toEqual({ outcome: "empty" });
  });

  it("accepts a name that does not collide with an existing Category", () => {
    const existing = [{ id: "cat-1", name: "Frutas" }];

    expect(validateNewCategory("Verduras", existing)).toEqual({
      outcome: "valid",
      name: "Verduras",
      normalizedName: "verduras",
    });
  });

  it("stores the cleaned display name: trimmed and with internal whitespace collapsed", () => {
    expect(validateNewCategory("  Lácteos   y huevos ", [])).toEqual({
      outcome: "valid",
      name: "Lácteos y huevos",
      normalizedName: "lacteos y huevos",
    });
  });

  it("rejects a name that collides with an existing Category under name matching", () => {
    const existing = [{ id: "cat-1", name: "Panadería" }];

    expect(validateNewCategory("panaderia", existing)).toEqual({
      outcome: "duplicate",
      existingCategory: { id: "cat-1", name: "Panadería" },
    });
  });
});

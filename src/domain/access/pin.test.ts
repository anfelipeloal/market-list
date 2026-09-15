import { describe, expect, it } from "vitest";
import { isValidPin } from "./pin";

describe("PIN format", () => {
  it("accepts exactly 4 ASCII digits", () => {
    expect(isValidPin("1234")).toBe(true);
  });

  it("rejects fewer than 4 digits", () => {
    expect(isValidPin("123")).toBe(false);
  });

  it("rejects more than 4 digits", () => {
    expect(isValidPin("12345")).toBe(false);
  });

  it("rejects a non-digit character", () => {
    expect(isValidPin("12a4")).toBe(false);
  });

  it("rejects leading whitespace", () => {
    expect(isValidPin(" 1234")).toBe(false);
  });

  it("rejects non-ASCII digits", () => {
    expect(isValidPin("١٢٣٤")).toBe(false);
  });
});

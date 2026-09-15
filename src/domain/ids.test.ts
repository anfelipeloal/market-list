import { describe, expect, it } from "vitest";
import { isValidId } from "./ids";

describe("id shape", () => {
  it("accepts a canonical lowercase UUID", () => {
    expect(isValidId("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
  });

  it("accepts a canonical uppercase UUID", () => {
    expect(isValidId("3FA85F64-5717-4562-B3FC-2C963F66AFA6")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidId("")).toBe(false);
  });

  it("rejects an id that is too short", () => {
    expect(isValidId("3fa85f64-5717-4562-b3fc-2c963f66af")).toBe(false);
  });

  it("rejects an id that is too long", () => {
    expect(isValidId("3fa85f64-5717-4562-b3fc-2c963f66afa6ff")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidId("3fa85f64-5717-4562-b3fc-2c963f66afzz")).toBe(false);
  });

  it("rejects an id missing hyphens", () => {
    expect(isValidId("3fa85f6457174562b3fc2c963f66afa6")).toBe(false);
  });

  it("rejects surrounding spaces", () => {
    expect(isValidId(" 3fa85f64-5717-4562-b3fc-2c963f66afa6 ")).toBe(false);
  });

  it("rejects a plain word", () => {
    expect(isValidId("not-a-uuid")).toBe(false);
  });
});

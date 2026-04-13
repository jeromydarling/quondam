import { describe, it, expect } from "vitest";
import { isValidEmail, isPasswordStrongEnough } from "./validation";

describe("isValidEmail", () => {
  it("accepts standard addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.com")).toBe(true);
    expect(isValidEmail("  trim@example.com  ")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("plain")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("a@.com")).toBe(false);
    expect(isValidEmail("a b@example.com")).toBe(false);
  });
});

describe("isPasswordStrongEnough", () => {
  it("requires 8+ characters", () => {
    expect(isPasswordStrongEnough("a1b2c3d")).toBe(false);
    expect(isPasswordStrongEnough("a1b2c3de")).toBe(true);
  });
  it("requires at least one letter", () => {
    expect(isPasswordStrongEnough("12345678")).toBe(false);
  });
  it("requires at least one digit", () => {
    expect(isPasswordStrongEnough("abcdefghi")).toBe(false);
  });
  it("accepts a typical mixed password", () => {
    expect(isPasswordStrongEnough("correcthorse1")).toBe(true);
  });
});

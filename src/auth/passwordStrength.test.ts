import { describe, it, expect } from "vitest";
import { scorePassword } from "./passwordStrength";

describe("scorePassword", () => {
  it("returns score 0 with no label for an empty password", () => {
    const r = scorePassword("");
    expect(r.score).toBe(0);
    expect(r.label).toBe("");
  });

  it("flags very common passwords as the lowest band", () => {
    const r = scorePassword("password");
    expect(r.score).toBe(0);
    expect(r.label).toBe("Too common");
  });

  it("scores a weak short password low", () => {
    const r = scorePassword("abc12");
    expect(r.score).toBeLessThanOrEqual(1);
  });

  it("scores a typical 8+ char mixed password as fair-or-strong", () => {
    const r = scorePassword("Correct1");
    expect(r.score).toBeGreaterThanOrEqual(2);
  });

  it("scores a long mixed-case+digits+symbol password as very strong", () => {
    const r = scorePassword("Correct-horse-Battery-9!");
    expect(r.score).toBe(4);
    expect(r.label).toBe("Very strong");
  });

  it("penalizes all-one-character passwords", () => {
    const r = scorePassword("aaaaaaaa");
    expect(r.score).toBe(0);
  });

  it("penalizes digits-only passwords", () => {
    const r = scorePassword("12345678901234");
    expect(r.score).toBeLessThan(2);
  });
});

import { describe, it, expect } from "vitest";
import { crosScholaUrl } from "./cros";

describe("crosScholaUrl", () => {
  it("builds a URL with the correct base host", () => {
    const url = crosScholaUrl("footer");
    expect(url.startsWith("https://myschola.app/")).toBe(true);
  });

  it("includes utm_source=quondam on every call", () => {
    expect(crosScholaUrl("footer")).toContain("utm_source=quondam");
    expect(crosScholaUrl("welcome")).toContain("utm_source=quondam");
  });

  it("encodes the surface as utm_medium", () => {
    expect(crosScholaUrl("welcome")).toContain("utm_medium=welcome");
    expect(crosScholaUrl("support")).toContain("utm_medium=support");
  });

  it("sets a shared utm_campaign", () => {
    expect(crosScholaUrl("footer")).toContain("utm_campaign=funnel");
  });
});

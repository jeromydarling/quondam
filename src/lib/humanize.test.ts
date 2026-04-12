import { describe, it, expect } from "vitest";
import { humanizeGain } from "./humanize";

describe("humanizeGain", () => {
  it("says 'matched' when gain is near zero", () => {
    expect(humanizeGain(0)).toBe("Volume matched to the others.");
    expect(humanizeGain(0.4)).toBe("Volume matched to the others.");
    expect(humanizeGain(-0.4)).toBe("Volume matched to the others.");
  });

  it("describes a small positive gain as 'Boosted a touch'", () => {
    expect(humanizeGain(1.2)).toBe(
      "Boosted a touch so it matches the other stories.",
    );
  });

  it("describes a small negative gain as 'Softened a touch'", () => {
    expect(humanizeGain(-1.2)).toBe(
      "Softened a touch so it matches the other stories.",
    );
  });

  it("uses 'noticeably' in the 2-5 dB band", () => {
    expect(humanizeGain(3)).toBe(
      "Boosted noticeably so it matches the other stories.",
    );
    expect(humanizeGain(-4.4)).toBe(
      "Softened noticeably so it matches the other stories.",
    );
  });

  it("uses 'significantly' above 5 dB", () => {
    expect(humanizeGain(7)).toBe(
      "Boosted significantly so it matches the other stories.",
    );
    expect(humanizeGain(-8.5)).toBe(
      "Softened significantly so it matches the other stories.",
    );
  });
});

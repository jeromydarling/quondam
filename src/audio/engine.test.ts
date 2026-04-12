import { describe, it, expect } from "vitest";
import {
  computeGainDb,
  dbToLinear,
  MAX_GAIN_DB,
  MIN_GAIN_DB,
} from "./engine";

describe("computeGainDb", () => {
  it("returns positive gain for a quiet track", () => {
    // -22 LUFS measured, target -18 → +4 dB
    expect(
      computeGainDb({
        integratedLufs: -22,
        truePeakDbtp: -1,
        targetLufs: -18,
      }),
    ).toBeCloseTo(4, 5);
  });

  it("returns negative gain for a loud track", () => {
    // -14 LUFS measured, target -18 → -4 dB
    expect(
      computeGainDb({
        integratedLufs: -14,
        truePeakDbtp: -0.5,
        targetLufs: -18,
      }),
    ).toBeCloseTo(-4, 5);
  });

  it("clamps absurdly quiet tracks to MAX_GAIN_DB", () => {
    expect(
      computeGainDb({
        integratedLufs: -50,
        truePeakDbtp: -10,
        targetLufs: -18,
      }),
    ).toBe(MAX_GAIN_DB);
  });

  it("clamps absurdly loud tracks to MIN_GAIN_DB", () => {
    expect(
      computeGainDb({
        integratedLufs: 0,
        truePeakDbtp: 0,
        targetLufs: -18,
      }),
    ).toBe(MIN_GAIN_DB);
  });
});

describe("dbToLinear", () => {
  it("converts 0 dB to 1.0", () => {
    expect(dbToLinear(0)).toBeCloseTo(1, 6);
  });
  it("converts +6 dB to ~2.0", () => {
    expect(dbToLinear(6)).toBeCloseTo(1.995, 2);
  });
  it("converts -6 dB to ~0.5", () => {
    expect(dbToLinear(-6)).toBeCloseTo(0.501, 2);
  });
});

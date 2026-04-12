import { describe, it, expect } from "vitest";
import { deriveCoverUrl, hashHue } from "./coverUrl";
import type { Story } from "../catalog/types";

const baseStory = (over: Partial<Story> = {}): Story => ({
  id: "librivox-x-y",
  title: "T",
  author: "A",
  source: {
    provider: "librivox",
    pageUrl: "https://librivox.org/x",
    audioUrl: "https://archive.org/download/example_id_librivox/track.mp3",
    license: "public-domain",
    attribution: "LibriVox",
  },
  durationSec: 60,
  lengthBucket: "short",
  ageBand: "3-6",
  mood: ["calming"],
  loudness: { integratedLufs: -20, truePeakDbtp: -1, targetLufs: -18 },
  safety: { reviewed: true, reviewer: "test", flags: [] },
  ...over,
});

describe("deriveCoverUrl", () => {
  it("prefers a curator-supplied coverUrl", () => {
    const s = baseStory({ coverUrl: "https://example.com/c.jpg" });
    expect(deriveCoverUrl(s)).toBe("https://example.com/c.jpg");
  });

  it("falls back to archive.org services/img derived from audioUrl", () => {
    expect(deriveCoverUrl(baseStory())).toBe(
      "https://archive.org/services/img/example_id_librivox",
    );
  });

  it("returns null for non-archive.org sources with no coverUrl", () => {
    const s = baseStory({
      source: {
        provider: "librivox",
        pageUrl: "https://librivox.org/x",
        audioUrl: "https://other.example.com/audio/file.mp3",
        license: "public-domain",
        attribution: "x",
      },
    });
    expect(deriveCoverUrl(s)).toBeNull();
  });
});

describe("hashHue", () => {
  it("is deterministic", () => {
    expect(hashHue("foo")).toBe(hashHue("foo"));
  });
  it("returns a value in [0, 360)", () => {
    for (const s of ["a", "b", "c", "librivox-aesop-fox", "x".repeat(50)]) {
      const h = hashHue(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });
});

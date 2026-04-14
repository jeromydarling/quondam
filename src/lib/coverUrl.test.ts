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
  it("returns a curator-supplied coverUrl when set", () => {
    const s = baseStory({ coverUrl: "https://example.com/c.jpg" });
    expect(deriveCoverUrl(s)).toBe("https://example.com/c.jpg");
  });

  it("returns null when coverUrl is absent (caller renders SVG fallback)", () => {
    // Note: we explicitly do NOT auto-derive from archive.org's thumbnail
    // service anymore — it produces waveform images for audio-only items
    // that look broken. The SVG fallback is strictly better.
    expect(deriveCoverUrl(baseStory())).toBeNull();
  });

  it("returns null even for non-archive audio sources", () => {
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

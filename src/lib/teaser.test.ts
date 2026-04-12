import { describe, it, expect } from "vitest";
import { computeNextTeaser } from "./teaser";
import type { Story } from "../catalog/types";

const baseStory = (over: Partial<Story> = {}): Story => ({
  id: "x",
  title: "T",
  author: "A",
  source: {
    provider: "librivox",
    pageUrl: "https://librivox.org/x",
    audioUrl: "https://archive.org/download/x/y.mp3",
    license: "public-domain",
    attribution: "x",
  },
  durationSec: 1000,
  lengthBucket: "medium",
  ageBand: "3-6",
  mood: ["calming"],
  loudness: { integratedLufs: -20, truePeakDbtp: -1, targetLufs: -18 },
  safety: { reviewed: true, reviewer: "test", flags: [] },
  ...over,
});

describe("computeNextTeaser", () => {
  it("returns the next chapter when chapters[] is present", () => {
    const s = baseStory({
      chapters: [
        { title: "Ch 1", startSec: 0, teaser: "first" },
        { title: "Ch 2", startSec: 200, teaser: "second" },
        { title: "Ch 3", startSec: 500, teaser: "third" },
      ],
    });
    expect(computeNextTeaser(s, 100)).toEqual({
      heading: "Next chapter",
      title: "Ch 2",
      teaser: "second",
    });
    expect(computeNextTeaser(s, 350)).toEqual({
      heading: "Next chapter",
      title: "Ch 3",
      teaser: "third",
    });
  });

  it("falls through to series teaser when in the last chapter", () => {
    const s = baseStory({
      chapters: [
        { title: "Only", startSec: 0 },
      ],
      series: {
        id: "set",
        name: "Set",
        order: 1,
        totalParts: 3,
        nextTeaser: "next time",
      },
    });
    expect(computeNextTeaser(s, 50)).toEqual({
      heading: "Tomorrow night",
      title: "Chapter 2 of 3",
      teaser: "next time",
    });
  });

  it("uses series teaser when no chapters[]", () => {
    const s = baseStory({
      series: {
        id: "set",
        name: "Set",
        order: 5,
        nextTeaser: "more soon",
      },
    });
    expect(computeNextTeaser(s, 0)).toEqual({
      heading: "Tomorrow night",
      title: "Chapter 6",
      teaser: "more soon",
    });
  });

  it("returns null when there is nothing to tease", () => {
    expect(computeNextTeaser(baseStory(), 0)).toBeNull();
  });
});

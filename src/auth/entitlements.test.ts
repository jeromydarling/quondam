import { describe, it, expect } from "vitest";
import {
  FREE_STORY_LIMIT,
  visibleToAnonymous,
  isAnonymousPlayable,
} from "./entitlements";
import type { Story } from "../catalog/types";

const makeStory = (id: string): Story => ({
  id,
  title: id,
  author: "x",
  source: {
    provider: "librivox",
    pageUrl: "https://librivox.org/x",
    audioUrl: "https://archive.org/download/x/y.mp3",
    license: "public-domain",
    attribution: "Public domain",
  },
  durationSec: 60,
  lengthBucket: "short",
  ageBand: "3-6",
  mood: ["calming"],
  loudness: { integratedLufs: -20, truePeakDbtp: -1, targetLufs: -18 },
  safety: { reviewed: true, reviewer: "test", flags: [] },
});

describe("visibleToAnonymous", () => {
  it("returns up to FREE_STORY_LIMIT stories", () => {
    const stories = Array.from({ length: 25 }, (_, i) => makeStory(`s${i}`));
    const visible = visibleToAnonymous(stories);
    expect(visible).toHaveLength(FREE_STORY_LIMIT);
    expect(visible[0].id).toBe("s0");
    expect(visible[FREE_STORY_LIMIT - 1].id).toBe(`s${FREE_STORY_LIMIT - 1}`);
  });

  it("returns the full list when there are fewer than the limit", () => {
    const stories = [makeStory("a"), makeStory("b"), makeStory("c")];
    expect(visibleToAnonymous(stories)).toHaveLength(3);
  });
});

describe("isAnonymousPlayable", () => {
  const stories = Array.from({ length: 15 }, (_, i) => makeStory(`s${i}`));

  it("returns true for stories within the free limit", () => {
    expect(isAnonymousPlayable("s0", stories)).toBe(true);
    expect(isAnonymousPlayable(`s${FREE_STORY_LIMIT - 1}`, stories)).toBe(true);
  });

  it("returns false for stories beyond the free limit", () => {
    expect(isAnonymousPlayable(`s${FREE_STORY_LIMIT}`, stories)).toBe(false);
    expect(isAnonymousPlayable("s14", stories)).toBe(false);
  });

  it("returns false for unknown story ids", () => {
    expect(isAnonymousPlayable("nope", stories)).toBe(false);
  });
});

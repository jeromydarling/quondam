import { describe, it, expect } from "vitest";
import { filterStories, toggle, formatDuration, EMPTY_FILTER } from "./filter";
import type { Story } from "./types";

const baseStory = (over: Partial<Story> = {}): Story => ({
  id: "librivox-x-y",
  title: "A Title",
  author: "An Author",
  source: {
    provider: "librivox",
    pageUrl: "https://librivox.org/x",
    audioUrl: "https://archive.org/x.mp3",
    license: "public-domain",
    attribution: "LibriVox",
  },
  durationSec: 300,
  lengthBucket: "short",
  ageBand: "3-6",
  mood: ["calming"],
  loudness: { integratedLufs: -20, truePeakDbtp: -1, targetLufs: -18 },
  safety: { reviewed: true, reviewer: "test", flags: [] },
  ...over,
});

describe("filterStories", () => {
  const stories: Story[] = [
    baseStory({ id: "a", ageBand: "0-3", lengthBucket: "short", mood: ["calming"] }),
    baseStory({
      id: "b",
      ageBand: "3-6",
      lengthBucket: "medium",
      mood: ["adventurous", "fairy-tale"],
      title: "Peter Rabbit",
    }),
    baseStory({
      id: "c",
      ageBand: "6-9",
      lengthBucket: "long",
      mood: ["nature", "classic"],
      author: "Kenneth Grahame",
    }),
  ];

  it("returns everything when criteria is empty", () => {
    expect(filterStories(stories, EMPTY_FILTER)).toHaveLength(3);
  });

  it("filters by age band", () => {
    const out = filterStories(stories, { ...EMPTY_FILTER, ageBands: ["3-6"] });
    expect(out.map((s) => s.id)).toEqual(["b"]);
  });

  it("filters by length bucket", () => {
    const out = filterStories(stories, {
      ...EMPTY_FILTER,
      lengthBuckets: ["short", "long"],
    });
    expect(out.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("filters by mood (any-of)", () => {
    const out = filterStories(stories, {
      ...EMPTY_FILTER,
      moods: ["fairy-tale"],
    });
    expect(out.map((s) => s.id)).toEqual(["b"]);
  });

  it("searches title and author case-insensitively", () => {
    expect(
      filterStories(stories, { ...EMPTY_FILTER, search: "peter" }).map(
        (s) => s.id,
      ),
    ).toEqual(["b"]);
    expect(
      filterStories(stories, { ...EMPTY_FILTER, search: "GRAHAME" }).map(
        (s) => s.id,
      ),
    ).toEqual(["c"]);
  });

  it("combines facets with AND", () => {
    const out = filterStories(stories, {
      ...EMPTY_FILTER,
      ageBands: ["3-6", "6-9"],
      moods: ["nature"],
    });
    expect(out.map((s) => s.id)).toEqual(["c"]);
  });
});

describe("toggle", () => {
  it("adds a value if absent", () => {
    expect(toggle([1, 2], 3)).toEqual([1, 2, 3]);
  });
  it("removes a value if present", () => {
    expect(toggle([1, 2, 3], 2)).toEqual([1, 3]);
  });
});

describe("formatDuration", () => {
  it("formats seconds under an hour as M:SS", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(184)).toBe("3:04");
    expect(formatDuration(612)).toBe("10:12");
  });
  it("formats seconds over an hour as H:MM:SS", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});

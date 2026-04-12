import type { AgeBand, LengthBucket, Mood, Story } from "./types";

export interface FilterCriteria {
  ageBands: AgeBand[];
  lengthBuckets: LengthBucket[];
  moods: Mood[];
  search: string;
}

export const EMPTY_FILTER: FilterCriteria = {
  ageBands: [],
  lengthBuckets: [],
  moods: [],
  search: "",
};

/**
 * Pure filter function. Empty arrays mean "no constraint on this facet".
 * Search matches title or author, case-insensitive, substring.
 */
export function filterStories(
  stories: readonly Story[],
  criteria: FilterCriteria,
): Story[] {
  const q = criteria.search.trim().toLowerCase();
  return stories.filter((s) => {
    if (criteria.ageBands.length && !criteria.ageBands.includes(s.ageBand)) {
      return false;
    }
    if (
      criteria.lengthBuckets.length &&
      !criteria.lengthBuckets.includes(s.lengthBucket)
    ) {
      return false;
    }
    if (
      criteria.moods.length &&
      !criteria.moods.some((m) => s.mood.includes(m))
    ) {
      return false;
    }
    if (q) {
      const hay = `${s.title} ${s.author}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function toggle<T>(arr: readonly T[], value: T): T[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m < 60) return `${m}:${s.toString().padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

// Types mirror catalog/schema.json. If the schema changes, change this too.

export type AgeBand = "0-3" | "3-6" | "6-9" | "9-12";
export type LengthBucket = "short" | "medium" | "long";
export type Mood =
  | "calming"
  | "brave"
  | "funny"
  | "fairy-tale"
  | "nature"
  | "faithful"
  | "heartwarming";
export type Provider = "librivox" | "archive";

export interface StorySource {
  provider: Provider;
  pageUrl: string;
  audioUrl: string;
  license: string;
  attribution: string;
}

export interface Loudness {
  /** ffmpeg ebur128 "I" — integrated loudness in LUFS. */
  integratedLufs: number;
  /** ffmpeg ebur128 "Peak" — true peak in dBTP. */
  truePeakDbtp: number;
  /** Recommended playback target in LUFS (e.g. -18 for bedtime). */
  targetLufs: number;
}

export interface Safety {
  reviewed: boolean;
  reviewer: string;
  flags: string[];
}

export type HissLevel = "none" | "low" | "high";

export interface Restoration {
  /** Curator's assessment of how much tape hiss the source has. */
  hissLevel: HissLevel;
  /** If true, the player auto-engages Tier 2 hiss reduction on first play. */
  suggestDenoise: boolean;
}

/**
 * Optional series metadata. Use when a story is one chapter of a larger
 * work split across multiple audio files (e.g. each LibriVox chapter is its
 * own track). The Player groups stories by `series.id` to find what comes
 * next, and shows `nextTeaser` as the "tomorrow night" teaser.
 */
export interface Series {
  id: string;
  name: string;
  /** 1-based index in the series. */
  order: number;
  totalParts?: number;
  /** One- or two-sentence teaser for the chapter immediately after this one. */
  nextTeaser?: string;
}

/**
 * Within-track chapter marker. Use when a single audio file contains
 * multiple chapters or sections (e.g. a collection of fables in one mp3).
 * The Player finds the chapter that contains the current playback position
 * and uses the *next* chapter's teaser as "tomorrow night".
 */
export interface Chapter {
  /** Human-readable chapter title. */
  title: string;
  /** Start time within the audio file, in seconds. */
  startSec: number;
  /** Optional one- or two-sentence teaser. */
  teaser?: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  /** Short blurb (1 sentence). Used in cards. */
  summary?: string;
  /** Long-form description (1-3 paragraphs). Used in the Player hero. */
  description?: string;
  /** Brief author bio (2-4 sentences). */
  authorBio?: string;
  /** Why this book matters / why a parent should pick it (1-2 sentences). */
  relevance?: string;
  /** Optional cover image URL. If absent, the player auto-derives one from
   *  the archive.org identifier in source.audioUrl, then falls back to a
   *  generated SVG. See src/components/BookCover.tsx. */
  coverUrl?: string;
  source: StorySource;
  durationSec: number;
  lengthBucket: LengthBucket;
  ageBand: AgeBand;
  mood: Mood[];
  loudness: Loudness;
  safety: Safety;
  /** Optional curator hint about audio restoration needs (tape hiss, etc.). */
  restoration?: Restoration;
  /** Optional: this story is one chapter of a larger series. */
  series?: Series;
  /** Optional: within-track chapter markers for multi-chapter audio files. */
  chapters?: Chapter[];
}

export interface Catalog {
  version: "1";
  generatedAt: string;
  stories: Story[];
}

export const ALL_AGE_BANDS: readonly AgeBand[] = ["0-3", "3-6", "6-9", "9-12"];
export const ALL_LENGTH_BUCKETS: readonly LengthBucket[] = [
  "short",
  "medium",
  "long",
];
export const ALL_MOODS: readonly Mood[] = [
  "calming",
  "brave",
  "funny",
  "fairy-tale",
  "nature",
  "faithful",
  "heartwarming",
];

export const LENGTH_BUCKET_LABEL: Record<LengthBucket, string> = {
  short: "Short · <10 min",
  medium: "Medium · 10–30 min",
  long: "Long · 30 min+",
};

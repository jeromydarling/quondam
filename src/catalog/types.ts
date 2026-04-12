// Types mirror catalog/schema.json. If the schema changes, change this too.

export type AgeBand = "0-3" | "3-6" | "6-9" | "9-12";
export type LengthBucket = "short" | "medium" | "long";
export type Mood =
  | "calming"
  | "adventurous"
  | "funny"
  | "fairy-tale"
  | "nature"
  | "classic";
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

export interface Story {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  summary?: string;
  source: StorySource;
  durationSec: number;
  lengthBucket: LengthBucket;
  ageBand: AgeBand;
  mood: Mood[];
  loudness: Loudness;
  safety: Safety;
  /** Optional curator hint about audio restoration needs (tape hiss, etc.). */
  restoration?: Restoration;
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
  "adventurous",
  "funny",
  "fairy-tale",
  "nature",
  "classic",
];

export const LENGTH_BUCKET_LABEL: Record<LengthBucket, string> = {
  short: "Short · <10 min",
  medium: "Medium · 10–30 min",
  long: "Long · 30 min+",
};

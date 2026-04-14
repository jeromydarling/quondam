import type { Story } from "../catalog/types";

/**
 * Derive a cover image URL for a story.
 *
 * Tiers:
 *   1. story.coverUrl (curator-supplied) — always wins when present
 *   2. null — caller renders the generated SVG fallback
 *
 * We deliberately do NOT fall through to archive.org's own thumbnail
 * service (archive.org/services/img/{id}) because, for audio-only items
 * without uploaded cover art, archive.org auto-generates a waveform
 * image. Those waveforms are low-resolution, visually identical across
 * all episodes of the same item, and look like broken placeholders in
 * a library grid. The generated SVG cover (see BookCover.tsx) is
 * always-available, deterministic per-story, and visually distinctive,
 * which is a strictly better fallback.
 *
 * Real archive.org-hosted cover art can still be used by setting
 * story.coverUrl explicitly in the catalog.
 */
export function deriveCoverUrl(story: Story): string | null {
  return story.coverUrl ?? null;
}

/**
 * Pure: turn a string into a stable [0..359] hue. Used so each story gets
 * a distinctive but reproducible cover-fallback color from its ID.
 */
export function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return ((h % 360) + 360) % 360;
}

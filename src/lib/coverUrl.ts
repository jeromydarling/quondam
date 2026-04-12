import type { Story } from "../catalog/types";

/**
 * Derive a cover image URL for a story.
 *
 * Priority:
 *   1. story.coverUrl (curator-supplied)
 *   2. archive.org's own thumbnail service, derived from the identifier in
 *      the audioUrl. Every LibriVox / Internet Archive item has a thumbnail
 *      at https://archive.org/services/img/{identifier}, served with CORS.
 *   3. null — caller should render the SVG fallback.
 *
 * The archive.org identifier is the path segment immediately following
 * `/download/` in the audioUrl. For
 *   https://archive.org/download/wind_willows_mfs_librivox/...mp3
 * the identifier is `wind_willows_mfs_librivox`.
 */
export function deriveCoverUrl(story: Story): string | null {
  if (story.coverUrl) return story.coverUrl;
  const m = story.source.audioUrl.match(
    /https?:\/\/(?:[^/]*\.)?archive\.org\/download\/([^/]+)\//,
  );
  if (m) {
    return `https://archive.org/services/img/${m[1]}`;
  }
  return null;
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

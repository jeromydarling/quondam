import type { Story } from "../catalog/types";

/**
 * Derive a cover image URL for a story.
 *
 * Tiers:
 *   1. story.coverUrl (curator-supplied or pipeline-generated) — always
 *      wins when present
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
 * Real cover art is populated into story.coverUrl either by hand (in
 * catalog.json) or by running `npm run covers` — see
 * scripts/fetch-covers.mjs.
 */
export function deriveCoverUrl(story: Story): string | null {
  return story.coverUrl ?? null;
}

/**
 * Resolve a cover URL from the catalog into a URL that's actually usable
 * by an <img src> tag. Handles both absolute URLs (http/https/data) and
 * relative paths (like "covers/foo.jpg") produced by the cover-fetch
 * pipeline.
 *
 * Relative paths are resolved against Vite's BASE_URL — this is `/` in
 * dev and `/quondam/` in the production GitHub Pages build.
 */
export function resolveCoverUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/^(?:https?:|data:)/i.test(raw)) return raw;
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, "")
      : "";
  const cleaned = raw.replace(/^\//, "");
  return `${base}/${cleaned}`;
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

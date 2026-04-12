/**
 * Pure: turn a per-track playback gain in dB into a single bedside-friendly
 * sentence. The technical numbers (LUFS, dB) live in a tooltip on the same
 * element so curious power users can still see them.
 *
 * Thresholds:
 *   |dB| < 0.5  → "matched"
 *   0.5–2       → "a touch"
 *   2–5         → "noticeably"
 *   > 5         → "significantly"
 */
export function humanizeGain(db: number): string {
  const abs = Math.abs(db);
  if (abs < 0.5) return "Volume matched to the others.";
  const direction = db > 0 ? "Boosted" : "Softened";
  let degree: string;
  if (abs < 2) degree = "a touch";
  else if (abs < 5) degree = "noticeably";
  else degree = "significantly";
  return `${direction} ${degree} so it matches the other stories.`;
}

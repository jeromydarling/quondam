import type { Story } from "../catalog/types";

export interface NextTeaser {
  /** Heading shown above the teaser, e.g. "Tomorrow night" or "Next chapter". */
  heading: string;
  /** Title of the next part. */
  title: string;
  /** Optional one- or two-sentence teaser. */
  teaser?: string;
}

/**
 * Compute what to show in the "tomorrow night" teaser card on the Player.
 *
 * Resolution order:
 *   1. If the story has within-track `chapters`, find the chapter containing
 *      `positionSec` and return the *next* chapter's title + teaser.
 *   2. Else if the story is part of a `series`, return the series's
 *      `nextTeaser` and synthesize a title like "Chapter N+1".
 *   3. Otherwise return null — no teaser to show.
 */
export function computeNextTeaser(
  story: Story,
  positionSec: number,
): NextTeaser | null {
  if (story.chapters && story.chapters.length > 0) {
    // Find the chapter that contains the current position.
    let currentIdx = 0;
    for (let i = 0; i < story.chapters.length; i++) {
      if (story.chapters[i].startSec <= positionSec) currentIdx = i;
      else break;
    }
    const next = story.chapters[currentIdx + 1];
    if (next) {
      return {
        heading: "Next chapter",
        title: next.title,
        teaser: next.teaser,
      };
    }
    // We're in the last chapter — fall through to series, if any.
  }

  if (story.series && story.series.nextTeaser) {
    return {
      heading: "Tomorrow night",
      title: `Chapter ${story.series.order + 1}${
        story.series.totalParts ? ` of ${story.series.totalParts}` : ""
      }`,
      teaser: story.series.nextTeaser,
    };
  }

  return null;
}

// Anonymous-tier visibility constants. There is no paid tier — these
// only constrain what unauthenticated users can see/do.
//
// Keeping this in one file means re-tuning the free experience is one
// edit, and the rule can be changed without grepping the codebase.

import type { Story } from "../catalog/types";

/** Anonymous users see at most this many stories from the catalog. */
export const FREE_STORY_LIMIT = 10;

/** Pure: return only the stories an anonymous visitor is allowed to see. */
export function visibleToAnonymous(stories: readonly Story[]): Story[] {
  return stories.slice(0, FREE_STORY_LIMIT);
}

/**
 * Pure: is this story id one an anonymous visitor can play? Used by the
 * Player to decide whether to redirect to sign-in for stories beyond the
 * free limit.
 */
export function isAnonymousPlayable(
  storyId: string,
  stories: readonly Story[],
): boolean {
  const idx = stories.findIndex((s) => s.id === storyId);
  return idx >= 0 && idx < FREE_STORY_LIMIT;
}

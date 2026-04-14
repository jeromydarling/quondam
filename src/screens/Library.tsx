import { useMemo, useState } from "react";
import { useCatalog } from "../catalog/useCatalog";
import { EMPTY_FILTER, filterStories, type FilterCriteria } from "../catalog/filter";
import FilterChips from "../components/FilterChips";
import StoryCard from "../components/StoryCard";
import WelcomeCard from "../components/WelcomeCard";
import BigSignUpCTA from "../components/BigSignUpCTA";
import { useIsSignedIn } from "../auth/useAuth";
import { visibleToAnonymous } from "../auth/entitlements";

export default function Library() {
  const isSignedIn = useIsSignedIn();
  const { catalog, loading, error } = useCatalog();
  const [criteria, setCriteria] = useState<FilterCriteria>(EMPTY_FILTER);

  // Anonymous users see the first FREE_STORY_LIMIT stories from the catalog;
  // signed-in users see everything. Everything else — covers, descriptions,
  // filters, search — is identical between the two.
  const visibleStories = useMemo(() => {
    if (!catalog) return [];
    return isSignedIn
      ? catalog.stories
      : visibleToAnonymous(catalog.stories);
  }, [catalog, isSignedIn]);

  const filtered = useMemo(
    () => filterStories(visibleStories, criteria),
    [visibleStories, criteria],
  );

  if (loading) return <p className="text-cream-300">Loading…</p>;
  if (error)
    return (
      <p className="text-amber">Failed to load catalog: {error.message}</p>
    );
  if (!catalog) return null;

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="label-eyebrow">The library</p>
        <h2 className="display-title">A few stories for tonight.</h2>
        <p className="body-prose">
          Hand-picked classic stories for bedtime — loudness-normalized so the
          volume doesn't change between tracks, with a sleep timer and a
          gentle fade-out for the way bedtime actually goes.
        </p>
      </header>

      {isSignedIn ? <WelcomeCard /> : <BigSignUpCTA />}

      <div className="space-y-5">
        <input
          type="search"
          inputMode="search"
          value={criteria.search}
          onChange={(e) => setCriteria({ ...criteria, search: e.target.value })}
          placeholder="Search title or author…"
          className="w-full rounded-xl bg-ink-900 border border-ink-700 px-5 py-4 text-base font-serif
                     focus:outline-none focus:border-amber placeholder:text-cream-500"
          aria-label="Search stories"
        />
        <FilterChips value={criteria} onChange={setCriteria} />
      </div>

      <p className="label-eyebrow">
        {filtered.length} of {visibleStories.length} stories
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {filtered.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-cream-400 italic text-center py-12">
          No stories match those filters tonight.
        </p>
      )}
    </section>
  );
}

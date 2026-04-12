import { useMemo, useState } from "react";
import { useCatalog } from "../catalog/useCatalog";
import { EMPTY_FILTER, filterStories, type FilterCriteria } from "../catalog/filter";
import FilterChips from "../components/FilterChips";
import StoryCard from "../components/StoryCard";

export default function Library() {
  const { catalog, loading, error } = useCatalog();
  const [criteria, setCriteria] = useState<FilterCriteria>(EMPTY_FILTER);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    return filterStories(catalog.stories, criteria);
  }, [catalog, criteria]);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="label-eyebrow">The library</p>
        <h2 className="display-title">A few stories for tonight.</h2>
        <p className="body-prose">
          Curated public-domain audio from archive.org and librivox.org —
          loudness-normalized so the volume doesn't change between tracks,
          with a sleep timer and a gentle fade-out for the way bedtime
          actually goes.
        </p>
      </header>

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

      {loading && <p className="text-cream-300">Loading…</p>}
      {error && (
        <p className="text-amber">Failed to load catalog: {error.message}</p>
      )}

      {!loading && !error && (
        <>
          <p className="label-eyebrow">
            {filtered.length} of {catalog?.stories.length ?? 0} stories
          </p>
          <div className="grid gap-5">
            {filtered.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-cream-400 italic text-center py-12">
              No stories match those filters tonight.
            </p>
          )}
        </>
      )}
    </section>
  );
}

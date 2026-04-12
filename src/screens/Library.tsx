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
    <section className="space-y-6">
      <div>
        <input
          type="search"
          inputMode="search"
          value={criteria.search}
          onChange={(e) => setCriteria({ ...criteria, search: e.target.value })}
          placeholder="Search title or author…"
          className="w-full rounded-xl bg-night-900 border border-night-700 px-4 py-3 text-base
                     focus:outline-none focus:border-accent placeholder:text-cream-500"
          aria-label="Search stories"
        />
      </div>

      <FilterChips value={criteria} onChange={setCriteria} />

      {loading && <p className="text-cream-300">Loading…</p>}
      {error && (
        <p className="text-accent">Failed to load catalog: {error.message}</p>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-cream-500">
            {filtered.length} of {catalog?.stories.length ?? 0} stories
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-cream-500 text-center py-8">
              No stories match those filters.
            </p>
          )}
        </>
      )}
    </section>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/useCatalog";
import { EMPTY_FILTER, filterStories, type FilterCriteria } from "../catalog/filter";
import FilterChips from "../components/FilterChips";
import StoryCard from "../components/StoryCard";
import SignInCTA from "../components/auth/SignInCTA";
import WelcomeCard from "../components/WelcomeCard";
import { useIsSignedIn } from "../auth/useAuth";
import { visibleToAnonymous } from "../auth/entitlements";

export default function Library() {
  const isSignedIn = useIsSignedIn();
  const { catalog, loading, error } = useCatalog();
  const [criteria, setCriteria] = useState<FilterCriteria>(EMPTY_FILTER);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    return filterStories(catalog.stories, criteria);
  }, [catalog, criteria]);

  if (loading) return <p className="text-cream-300">Loading…</p>;
  if (error)
    return (
      <p className="text-amber">Failed to load catalog: {error.message}</p>
    );
  if (!catalog) return null;

  // ----- Anonymous: bare list of top 10 titles -----
  if (!isSignedIn) {
    const previewStories = visibleToAnonymous(catalog.stories);
    return (
      <section className="space-y-8">
        <header className="space-y-3">
          <p className="label-eyebrow">The library</p>
          <h2 className="display-title">Stories for tonight.</h2>
          <p className="body-prose">
            Hand-picked classic stories for bedtime, with a calm player and
            a gentle sleep timer. Free forever — no payment, no card.
          </p>
        </header>

        <SignInCTA
          title="Sign in for covers, descriptions, sleep timer, favorites, and more."
        />

        <ol className="divide-y divide-ink-800 panel">
          {previewStories.map((s, i) => (
            <li key={s.id} className="px-5 py-4 flex items-center gap-4">
              <span className="font-serif text-2xl text-cream-400 w-8 text-right tabular-nums shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/play/${encodeURIComponent(s.id)}`}
                  className="block hover:text-amber"
                >
                  <h3
                    className="font-serif text-xl text-cream-50 leading-tight truncate"
                    style={{
                      fontVariationSettings:
                        '"opsz" 144, "SOFT" 60, "wght" 500',
                    }}
                  >
                    {s.title}
                  </h3>
                </Link>
                <p className="text-sm text-cream-400 italic truncate">
                  by {s.author}
                </p>
              </div>
              <Link
                to={`/play/${encodeURIComponent(s.id)}`}
                className="btn-ghost shrink-0"
                aria-label={`Play ${s.title}`}
              >
                Play
              </Link>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  // ----- Signed in: full library -----
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

      <WelcomeCard />

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
        {filtered.length} of {catalog.stories.length} stories
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

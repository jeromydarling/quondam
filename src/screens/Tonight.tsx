import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/useCatalog";
import { useStore } from "../state/store";
import { formatDuration } from "../catalog/filter";
import BookCover from "../components/BookCover";

export default function Tonight() {
  const { catalog, loading } = useCatalog();
  const tonight = useStore((s) => s.tonight);
  const removeFromTonight = useStore((s) => s.removeFromTonight);
  const reorderTonight = useStore((s) => s.reorderTonight);

  if (loading || !catalog) return <p className="text-cream-300">Loading…</p>;

  const byId = new Map(catalog.stories.map((s) => [s.id, s]));
  const items = tonight
    .map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  const totalSec = items.reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="label-eyebrow">Tonight</p>
        <h2 className="display-title">Tonight's shortlist.</h2>
        {items.length > 0 && (
          <p className="body-prose">
            {items.length} {items.length === 1 ? "story" : "stories"} ·{" "}
            {formatDuration(totalSec)} of bedtime listening.
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <p className="body-prose text-cream-400 italic">
          Nothing yet — add stories from the{" "}
          <Link to="/" className="text-amber underline decoration-amber/40">
            Library
          </Link>
          .
        </p>
      ) : (
        <ol className="space-y-4">
          {items.map((s, idx) => (
            <li
              key={s.id}
              className="panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Top row on mobile, left side on desktop: number + cover + title/meta */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <span className="font-serif text-2xl text-cream-400 w-6 text-right tabular-nums shrink-0">
                  {idx + 1}
                </span>
                <Link
                  to={`/play/${encodeURIComponent(s.id)}`}
                  className="shrink-0 w-14"
                  aria-label={`Play ${s.title}`}
                >
                  <BookCover
                    story={s}
                    className="w-full"
                    showFallbackTitle={false}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/play/${encodeURIComponent(s.id)}`}
                    className="block hover:text-amber"
                  >
                    <h3
                      className="font-serif text-lg sm:text-xl text-cream-50 leading-tight truncate"
                      style={{
                        fontVariationSettings:
                          '"opsz" 144, "SOFT" 60, "wght" 500',
                      }}
                    >
                      {s.title}
                    </h3>
                  </Link>
                  <div className="text-xs text-cream-400 italic mt-0.5 truncate">
                    {s.author} · {formatDuration(s.durationSec)} · age{" "}
                    {s.ageBand}
                  </div>
                </div>
              </div>

              {/* Controls: full row on mobile, right side on desktop */}
              <div className="flex gap-2 justify-end sm:shrink-0 sm:justify-start border-t border-ink-800 pt-3 sm:border-t-0 sm:pt-0">
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => reorderTonight(idx, idx - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  aria-label="Move down"
                  disabled={idx === items.length - 1}
                  onClick={() => reorderTonight(idx, idx + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  aria-label="Remove"
                  onClick={() => removeFromTonight(s.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

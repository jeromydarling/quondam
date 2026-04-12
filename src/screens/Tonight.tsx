import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/useCatalog";
import { useStore } from "../state/store";
import { formatDuration } from "../catalog/filter";

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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Tonight's shortlist</h2>
      {items.length === 0 ? (
        <p className="text-cream-500">
          Nothing yet — add stories from the{" "}
          <Link to="/" className="text-accent underline">
            Library
          </Link>
          .
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((s, idx) => (
            <li
              key={s.id}
              className="rounded-xl bg-night-900 border border-night-800 p-3 flex items-center gap-3"
            >
              <span className="text-cream-500 w-6 text-right">{idx + 1}.</span>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/play/${encodeURIComponent(s.id)}`}
                  className="block font-medium hover:text-accent truncate"
                >
                  {s.title}
                </Link>
                <div className="text-xs text-cream-500">
                  {s.author} · {formatDuration(s.durationSec)} · age {s.ageBand}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn px-2"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => reorderTonight(idx, idx - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn px-2"
                  aria-label="Move down"
                  disabled={idx === items.length - 1}
                  onClick={() => reorderTonight(idx, idx + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn px-2"
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

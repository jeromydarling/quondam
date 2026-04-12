import { Link } from "react-router-dom";
import type { Story } from "../catalog/types";
import { formatDuration } from "../catalog/filter";
import { useStore } from "../state/store";

export default function StoryCard({ story }: { story: Story }) {
  const isFav = useStore((s) => s.favorites.includes(story.id));
  const inTonight = useStore((s) => s.tonight.includes(story.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const addToTonight = useStore((s) => s.addToTonight);
  const removeFromTonight = useStore((s) => s.removeFromTonight);

  return (
    <article className="rounded-2xl bg-night-900 border border-night-800 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/play/${encodeURIComponent(story.id)}`}
            className="block text-lg font-medium hover:text-accent truncate"
            title={story.title}
          >
            {story.title}
          </Link>
          <div className="text-sm text-cream-300 truncate">
            {story.author}
            {story.narrator ? ` · narrated by ${story.narrator}` : ""}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={isFav}
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
          onClick={() => toggleFavorite(story.id)}
          className="min-h-tap min-w-tap flex items-center justify-center text-2xl"
          title={isFav ? "Favorited" : "Favorite"}
        >
          {isFav ? "♥" : "♡"}
        </button>
      </div>

      {story.summary && (
        <p className="text-sm text-cream-300 line-clamp-2">{story.summary}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-cream-500">
        <span className="rounded-full bg-night-800 px-2 py-1">
          Age {story.ageBand}
        </span>
        <span className="rounded-full bg-night-800 px-2 py-1">
          {formatDuration(story.durationSec)}
        </span>
        {story.mood.map((m) => (
          <span key={m} className="rounded-full bg-night-800 px-2 py-1">
            {m}
          </span>
        ))}
        {story.safety.flags.map((f) => (
          <span
            key={f}
            className="rounded-full bg-night-800 text-accent-dim px-2 py-1"
            title="Content note"
          >
            ⚠ {f}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Link
          to={`/play/${encodeURIComponent(story.id)}`}
          className="btn-accent flex-1"
        >
          ▶ Play
        </Link>
        <button
          type="button"
          className={inTonight ? "btn bg-night-600" : "btn"}
          onClick={() =>
            inTonight
              ? removeFromTonight(story.id)
              : addToTonight(story.id)
          }
        >
          {inTonight ? "✓ Tonight" : "+ Tonight"}
        </button>
      </div>
    </article>
  );
}

import { Link } from "react-router-dom";
import type { Story } from "../catalog/types";
import { formatDuration } from "../catalog/filter";
import { useStore } from "../state/store";
import BookCover from "./BookCover";

export default function StoryCard({ story }: { story: Story }) {
  const isFav = useStore((s) => s.favorites.includes(story.id));
  const inTonight = useStore((s) => s.tonight.includes(story.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const addToTonight = useStore((s) => s.addToTonight);
  const removeFromTonight = useStore((s) => s.removeFromTonight);

  return (
    <article className="panel p-5 flex flex-col gap-5">
      {/* Cover: full width, on its own line */}
      <Link
        to={`/play/${encodeURIComponent(story.id)}`}
        className="block group"
        aria-label={`Play ${story.title}`}
      >
        <BookCover
          story={story}
          className="w-full transition-transform group-hover:scale-[1.01]"
        />
      </Link>

      {/* Title + favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {story.series && (
            <p className="label-eyebrow mb-1">{story.series.name}</p>
          )}
          <Link
            to={`/play/${encodeURIComponent(story.id)}`}
            className="block hover:text-amber"
          >
            <h3
              className="font-serif text-2xl text-cream-50 leading-tight tracking-tight text-balance"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500' }}
              title={story.title}
            >
              {story.title}
            </h3>
          </Link>
          <div className="mt-1 text-sm text-cream-300 italic">
            by {story.author}
            {story.narrator ? (
              <span className="text-cream-400 not-italic"> · {story.narrator}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={isFav}
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
          onClick={() => toggleFavorite(story.id)}
          className="min-h-tap min-w-tap flex items-center justify-center text-2xl text-amber shrink-0"
          title={isFav ? "Favorited" : "Favorite"}
        >
          {isFav ? "♥" : "♡"}
        </button>
      </div>

      {story.summary && (
        <p className="text-[15px] leading-snug text-cream-200/90 line-clamp-3 max-w-prose">
          {story.summary}
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 label-eyebrow opacity-90">
        <span>Age {story.ageBand}</span>
        <span>{formatDuration(story.durationSec)}</span>
        <span>{story.mood.slice(0, 2).join(" · ")}</span>
        {story.safety.flags.length > 0 && (
          <span className="text-amber-dim normal-case tracking-normal">
            ⚠ {story.safety.flags[0]}
          </span>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          to={`/play/${encodeURIComponent(story.id)}`}
          className="btn-accent flex-1"
        >
          Play
        </Link>
        <button
          type="button"
          className={inTonight ? "btn bg-ink-700" : "btn-ghost"}
          onClick={() =>
            inTonight ? removeFromTonight(story.id) : addToTonight(story.id)
          }
        >
          {inTonight ? "✓ Tonight" : "+ Tonight"}
        </button>
      </div>
    </article>
  );
}

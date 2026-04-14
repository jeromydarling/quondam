import { useState } from "react";
import type { Story } from "../catalog/types";
import { deriveCoverUrl, hashHue, resolveCoverUrl } from "../lib/coverUrl";

interface Props {
  story: Story;
  /** Tailwind size classes for the wrapping element. */
  className?: string;
  /** Show the title typeset on the fallback cover. Off for tiny thumbnails. */
  showFallbackTitle?: boolean;
}

/**
 * Two-tier cover renderer:
 *   1. story.coverUrl (absolute URL or relative path like
 *      "covers/foo.jpg") — resolved against Vite's BASE_URL
 *   2. Generated SVG cover with the title typeset on a deterministic palette
 *
 * Tier 1 is tried as an <img> tag. If it errors (404, network, CORS), we
 * fall through to the SVG cover, which is always renderable.
 */
export default function BookCover({
  story,
  className = "",
  showFallbackTitle = true,
}: Props) {
  const initialUrl = resolveCoverUrl(deriveCoverUrl(story));
  const [errored, setErrored] = useState(false);
  const showImage = initialUrl !== null && !errored;

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-cover bg-ink-850 ${className}`}
      style={{ aspectRatio: "2 / 3" }}
    >
      {showImage ? (
        <img
          src={initialUrl ?? ""}
          alt={`Cover of ${story.title}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <FallbackCover story={story} showTitle={showFallbackTitle} />
      )}
      {/* Soft inner edge for any cover, to feel like a real book */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 -40px 60px -30px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

function FallbackCover({
  story,
  showTitle,
}: {
  story: Story;
  showTitle: boolean;
}) {
  const hue = hashHue(story.id);
  const a = `hsl(${hue} 35% 22%)`;
  const b = `hsl(${(hue + 40) % 360} 30% 12%)`;
  const accent = `hsl(${(hue + 200) % 360} 55% 70%)`;

  return (
    <svg
      viewBox="0 0 200 300"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-${story.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#g-${story.id})`} />
      {/* Decorative double border */}
      <rect
        x="10"
        y="10"
        width="180"
        height="280"
        fill="none"
        stroke={accent}
        strokeOpacity="0.4"
        strokeWidth="0.7"
      />
      <rect
        x="14"
        y="14"
        width="172"
        height="272"
        fill="none"
        stroke={accent}
        strokeOpacity="0.2"
        strokeWidth="0.5"
      />
      {/* Tiny ornament */}
      <g
        transform="translate(100 50)"
        fill={accent}
        fillOpacity="0.55"
      >
        <circle cx="0" cy="0" r="2.4" />
        <circle cx="-10" cy="0" r="1.2" />
        <circle cx="10" cy="0" r="1.2" />
      </g>
      {showTitle && (
        <>
          <foreignObject x="18" y="80" width="164" height="160">
            <div
              style={{
                fontFamily:
                  "Fraunces, ui-serif, Georgia, serif",
                fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500',
                color: "#f7f1e0",
                fontSize: "20px",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                textAlign: "center",
                textWrap: "balance",
              }}
            >
              {story.title}
            </div>
          </foreignObject>
          <text
            x="100"
            y="270"
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontSize="9"
            fill="#f7f1e0"
            fillOpacity="0.65"
            fontStyle="italic"
          >
            {story.author}
          </text>
        </>
      )}
    </svg>
  );
}

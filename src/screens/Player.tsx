import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCatalog } from "../catalog/useCatalog";
import { useStore } from "../state/store";
import { useAudioEngine } from "../audio/useAudioEngine";
import { formatDuration } from "../catalog/filter";
import { computeNextTeaser } from "../lib/teaser";
import { humanizeGain } from "../lib/humanize";
import BookCover from "../components/BookCover";
import VuMeter from "../components/VuMeter";
import Scrubber from "../components/Scrubber";
import SleepTimerControl from "../components/SleepTimerControl";

export default function Player() {
  const { id = "" } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id);
  const navigate = useNavigate();
  const { catalog, loading } = useCatalog();

  const story = useMemo(
    () => catalog?.stories.find((s) => s.id === decodedId) ?? null,
    [catalog, decodedId],
  );

  const setResume = useStore((s) => s.setResume);
  const savedPosition = useStore((s) => s.resumeMap[decodedId]);
  const clearResume = useStore((s) => s.clearResume);
  const denoiseOverride = useStore((s) => s.denoiseOverrides[decodedId]);
  const setDenoiseOverride = useStore((s) => s.setDenoiseOverride);

  const [useSaved, setUseSaved] = useState(true);
  const [fadeSec, setFadeSec] = useState(30);
  const [showAuthor, setShowAuthor] = useState(false);

  const denoiseEnabled =
    denoiseOverride ?? story?.restoration?.suggestDenoise ?? false;

  const onPositionTick = useCallback(
    (sec: number) => {
      if (!story) return;
      setResume(story.id, sec);
    },
    [story, setResume],
  );

  const {
    audioRef,
    isPlaying,
    duration,
    position,
    appliedGainDb,
    error,
    analyser,
    togglePlay,
    seek,
    startSleepTimer,
    cancelSleepTimer,
    sleepTimerActive,
  } = useAudioEngine({
    story,
    initialPosition: useSaved ? savedPosition : 0,
    onPositionTick,
    denoise: denoiseEnabled,
  });

  const teaser = useMemo(
    () => (story ? computeNextTeaser(story, position) : null),
    [story, position],
  );

  if (loading) return <p className="text-cream-300">Loading…</p>;
  if (!story)
    return (
      <div className="space-y-4">
        <p className="body-prose text-cream-300">Story not found.</p>
        <Link to="/" className="btn-accent">
          Back to library
        </Link>
      </div>
    );

  return (
    <section className="space-y-10">
      <button
        type="button"
        className="btn-ghost px-3"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* HERO: cover + title + author + relevance */}
      <div className="grid gap-8 sm:grid-cols-[200px_1fr] sm:gap-10 items-start">
        <BookCover story={story} className="w-44 sm:w-[200px]" />
        <div className="space-y-4">
          {story.series && (
            <p className="label-eyebrow">
              {story.series.name} · Chapter {story.series.order}
              {story.series.totalParts ? ` of ${story.series.totalParts}` : ""}
            </p>
          )}
          <h2 className="display-title text-balance">{story.title}</h2>
          <p className="font-serif text-lg italic text-cream-200">
            by {story.author}
          </p>
          {story.relevance && (
            <p className="font-serif text-base text-amber/90 italic max-w-prose">
              {story.relevance}
            </p>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}
      {story.description && (
        <div className="space-y-2">
          <p className="label-eyebrow">About this story</p>
          <p className="body-prose">{story.description}</p>
        </div>
      )}

      {/* The hidden audio element. crossorigin is essential so the Web Audio
          graph can analyze/process the stream without tainting. */}
      <audio
        ref={audioRef}
        src={story.source.audioUrl}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {error && (
        <div className="rounded-xl border border-amber-dim bg-ink-900 p-3 text-amber">
          {error}
        </div>
      )}

      {savedPosition !== undefined &&
        useSaved &&
        !isPlaying &&
        position < 1 && (
          <div className="panel p-4 flex items-center justify-between gap-3">
            <span className="font-serif text-cream-100">
              Resume from{" "}
              <span className="text-amber tabular-nums">
                {formatDuration(savedPosition)}
              </span>
              ?
            </span>
            <button
              type="button"
              className="btn-ghost px-3"
              onClick={() => {
                clearResume(story.id);
                setUseSaved(false);
                seek(0);
              }}
            >
              Start over
            </button>
          </div>
        )}

      {/* PLAYER CORE: VU meter, transport, scrubber */}
      <div className="panel p-6 sm:p-8 space-y-6">
        <VuMeter analyser={analyser} active={isPlaying} />

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            className="btn-accent w-28 h-28 rounded-full text-3xl shadow-cover"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>

        <Scrubber position={position} duration={duration} onSeek={seek} />

        {appliedGainDb !== null && (
          <p
            className="text-center font-serif italic text-sm text-cream-400 opacity-90"
            title={`${story.loudness.integratedLufs.toFixed(1)} LUFS, gain ${
              appliedGainDb >= 0 ? "+" : ""
            }${appliedGainDb.toFixed(1)} dB, target ${story.loudness.targetLufs.toFixed(0)} LUFS`}
          >
            {humanizeGain(appliedGainDb)}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-ink-800">
          <div className="text-sm pr-3">
            <div className="font-serif text-cream-100">Quiet the hiss</div>
            <div className="font-serif text-cream-300 italic text-[13px] mt-0.5 max-w-prose">
              {story.restoration?.hissLevel === "high"
                ? "An older recording with audible background hiss — we recommend leaving this on tonight."
                : story.restoration?.hissLevel === "low"
                  ? "A little background hiss in this recording. Cleanup is optional."
                  : "Gently smooths tape hiss in older recordings without dulling the reader's voice."}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={denoiseEnabled}
            onClick={() => setDenoiseOverride(story.id, !denoiseEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              denoiseEnabled ? "bg-amber" : "bg-ink-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-ink-950 transition-transform ${
                denoiseEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* SLEEP TIMER */}
      <SleepTimerControl
        active={sleepTimerActive}
        fadeSec={fadeSec}
        onFadeChange={setFadeSec}
        onStart={startSleepTimer}
        onCancel={cancelSleepTimer}
      />

      {/* TOMORROW NIGHT teaser */}
      {teaser && (
        <div className="panel p-5 space-y-2 border-l-4 border-l-amber/60">
          <p className="label-eyebrow">{teaser.heading}</p>
          <h3
            className="font-serif text-2xl text-cream-50"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500' }}
          >
            {teaser.title}
          </h3>
          {teaser.teaser && (
            <p className="font-serif italic text-cream-200 max-w-prose">
              {teaser.teaser}
            </p>
          )}
        </div>
      )}

      {/* AUTHOR BIO — collapsible */}
      {story.authorBio && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAuthor((v) => !v)}
            className="label-eyebrow flex items-center gap-2 hover:text-cream-200"
            aria-expanded={showAuthor}
          >
            About the author
            <span className={showAuthor ? "rotate-180" : ""}>▾</span>
          </button>
          {showAuthor && (
            <p className="body-prose">{story.authorBio}</p>
          )}
        </div>
      )}

    </section>
  );
}

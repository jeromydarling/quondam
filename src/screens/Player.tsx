import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCatalog } from "../catalog/useCatalog";
import { useStore } from "../state/store";
import { useAudioEngine } from "../audio/useAudioEngine";
import { formatDuration } from "../catalog/filter";
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

  // Decision: do we honor the saved position on load? Yes by default; user
  // can dismiss the resume banner before pressing play to start over.
  const [useSaved, setUseSaved] = useState(true);
  const [fadeSec, setFadeSec] = useState(30);

  // Effective denoise = user override if set, else catalog hint, else off.
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

  if (loading) return <p className="text-cream-300">Loading…</p>;
  if (!story)
    return (
      <div className="space-y-3">
        <p className="text-cream-300">Story not found.</p>
        <Link to="/" className="btn-accent">
          Back to library
        </Link>
      </div>
    );

  return (
    <section className="space-y-6">
      <button type="button" className="btn px-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <header className="space-y-1">
        <h2 className="text-2xl font-semibold leading-tight">{story.title}</h2>
        <p className="text-cream-300">
          {story.author}
          {story.narrator ? ` · ${story.narrator}` : ""}
        </p>
        {story.summary && (
          <p className="text-sm text-cream-300 mt-2">{story.summary}</p>
        )}
      </header>

      {/* The hidden audio element. crossorigin is essential so the Web Audio
          graph can analyze/process the stream without tainting. */}
      <audio
        ref={audioRef}
        src={story.source.audioUrl}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {error && (
        <div className="rounded-xl border border-accent-dim bg-night-900 p-3 text-accent">
          {error}
        </div>
      )}

      {savedPosition !== undefined && useSaved && !isPlaying && position < 1 && (
        <div className="rounded-xl bg-night-800 border border-night-600 p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-cream-100">
            Resume from {formatDuration(savedPosition)}?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn px-3"
              onClick={() => {
                clearResume(story.id);
                setUseSaved(false);
                seek(0);
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-night-900 border border-night-800 p-5 space-y-4">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            className="btn-accent w-24 h-24 rounded-full text-3xl"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>

        <Scrubber position={position} duration={duration} onSeek={seek} />

        {appliedGainDb !== null && (
          <p className="text-center text-xs text-cream-500 tabular-nums">
            Loudness: {story.loudness.integratedLufs.toFixed(1)} LUFS · gain
            applied {appliedGainDb >= 0 ? "+" : ""}
            {appliedGainDb.toFixed(1)} dB · target{" "}
            {story.loudness.targetLufs.toFixed(0)} LUFS
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-night-800">
          <div className="text-sm">
            <div className="text-cream-100">Reduce hiss</div>
            <div className="text-xs text-cream-500">
              {story.restoration?.hissLevel === "high"
                ? "Source has heavy tape hiss — recommended"
                : story.restoration?.hissLevel === "low"
                  ? "Source has light hiss"
                  : "High-band downward expander"}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={denoiseEnabled}
            onClick={() => setDenoiseOverride(story.id, !denoiseEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              denoiseEnabled ? "bg-accent" : "bg-night-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-night-950 transition-transform ${
                denoiseEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <SleepTimerControl
        active={sleepTimerActive}
        fadeSec={fadeSec}
        onFadeChange={setFadeSec}
        onStart={startSleepTimer}
        onCancel={cancelSleepTimer}
      />

      <p className="text-xs text-cream-500">
        Source:{" "}
        <a
          href={story.source.pageUrl}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-cream-300"
        >
          {story.source.attribution}
        </a>{" "}
        · {story.source.license}
      </p>
    </section>
  );
}

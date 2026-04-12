import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "../catalog/types";
import {
  applyLoudness,
  buildGraph,
  setDenoiseEnabled,
  type AudioGraph,
} from "./engine";
import { scheduleSleepTimer, type SleepTimerHandle } from "./sleepTimer";

interface UseAudioEngineArgs {
  story: Story | null;
  /** Initial seek position when the story loads, in seconds. */
  initialPosition?: number;
  /** Called periodically with the current playback position (throttled). */
  onPositionTick?: (sec: number) => void;
  /** Tier 2 hiss reduction enabled. */
  denoise?: boolean;
}

interface UseAudioEngineApi {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  duration: number;
  position: number;
  appliedGainDb: number | null;
  ready: boolean;
  error: string | null;

  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seek: (sec: number) => void;

  startSleepTimer: (totalSec: number, fadeSec?: number) => void;
  cancelSleepTimer: () => void;
  sleepTimerActive: boolean;
}

const POSITION_REPORT_INTERVAL_MS = 5000;

/**
 * Owns the AudioContext + graph for one story at a time. Re-initializes the
 * graph when the story changes. Reports position to the parent (throttled to
 * 5 s) so the Zustand store can persist resume positions to localStorage.
 */
export function useAudioEngine({
  story,
  initialPosition,
  onPositionTick,
  denoise = false,
}: UseAudioEngineArgs): UseAudioEngineApi {
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  const sleepHandleRef = useRef<SleepTimerHandle | null>(null);
  const lastReportedRef = useRef(0);
  const initialPositionRef = useRef(initialPosition);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(initialPosition ?? 0);
  const [appliedGainDb, setAppliedGainDb] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sleepTimerActive, setSleepTimerActive] = useState(false);

  // Keep latest initialPosition in a ref so we can apply it once metadata loads
  // without re-running the main effect on every change.
  useEffect(() => {
    initialPositionRef.current = initialPosition;
  }, [initialPosition]);

  // (Re)build the graph + bind events whenever the story changes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !story) return;

    setReady(false);
    setError(null);
    setIsPlaying(false);
    setPosition(initialPositionRef.current ?? 0);
    setAppliedGainDb(null);

    // Lazily create the AudioContext on first use; reuse across stories.
    let context: AudioContext;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      context = graphRef.current?.context ?? new Ctor();
    } catch {
      setError("Web Audio API is unavailable in this browser.");
      return;
    }

    // The MediaElementSource can only be created once per element. If we
    // already built a graph for this element, reuse it.
    let graph = graphRef.current;
    if (!graph || graph.element !== el) {
      try {
        graph = buildGraph(context, el);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to build audio graph.");
        return;
      }
      graphRef.current = graph;
    }

    const db = applyLoudness(graph, story.loudness);
    setAppliedGainDb(db);
    setDenoiseEnabled(graph, denoise);

    const onLoaded = () => {
      setDuration(el.duration || story.durationSec);
      const start = initialPositionRef.current ?? 0;
      if (start > 0 && start < (el.duration || story.durationSec)) {
        try {
          el.currentTime = start;
        } catch {
          /* ignore — some browsers throw before metadata fully ready */
        }
      }
      setReady(true);
    };
    const onTime = () => {
      setPosition(el.currentTime);
      const now = Date.now();
      if (now - lastReportedRef.current >= POSITION_REPORT_INTERVAL_MS) {
        lastReportedRef.current = now;
        onPositionTick?.(el.currentTime);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      onPositionTick?.(0);
    };
    const onErr = () => setError("Could not load this audio.");

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onErr);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onErr);
      sleepHandleRef.current?.cancel();
      sleepHandleRef.current = null;
      setSleepTimerActive(false);
    };
    // We intentionally include `denoise` here so that if it changes between
    // renders before the graph exists, the next effect run picks it up. The
    // buildGraph() call is guarded against rebuild for the same element, so
    // this re-run is cheap (just re-applies loudness + denoise state).
  }, [story, onPositionTick, denoise]);

  const play = useCallback(async () => {
    const el = audioRef.current;
    const ctx = graphRef.current?.context;
    if (!el || !ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    try {
      await el.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback was blocked.");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    if (audioRef.current?.paused) await play();
    else pause();
  }, [play, pause]);

  const seek = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(sec, el.duration || sec));
    setPosition(el.currentTime);
  }, []);

  const startSleepTimer = useCallback(
    (totalSec: number, fadeSec = 30) => {
      const graph = graphRef.current;
      if (!graph) return;
      sleepHandleRef.current?.cancel();
      sleepHandleRef.current = scheduleSleepTimer(
        {
          context: graph.context,
          gainParam: graph.gain.gain,
          onStop: () => {
            audioRef.current?.pause();
            setSleepTimerActive(false);
            sleepHandleRef.current = null;
          },
        },
        { totalSec, fadeSec },
      );
      setSleepTimerActive(true);
    },
    [],
  );

  const cancelSleepTimer = useCallback(() => {
    sleepHandleRef.current?.cancel();
    sleepHandleRef.current = null;
    setSleepTimerActive(false);
  }, []);

  return {
    audioRef,
    isPlaying,
    duration,
    position,
    appliedGainDb,
    ready,
    error,
    play,
    pause,
    togglePlay,
    seek,
    startSleepTimer,
    cancelSleepTimer,
    sleepTimerActive,
  };
}

/**
 * Sleep timer with gentle fade-out.
 *
 * Schedules:
 *   1. A linearRampToValueAtTime on the GainNode from current value -> 0
 *      starting at (now + totalSec - fadeSec).
 *   2. A setTimeout that pauses the <audio> element after the fade.
 *
 * Cancellable. Designed to take its dependencies (AudioContext, GainNode,
 * pause callback, scheduler) so it is unit-testable with mocks.
 */

/**
 * Narrow shape of the AudioParam methods we use, defined locally so tests
 * can supply a plain mock without satisfying AudioParam's chainable return
 * types.
 */
export interface GainParamLike {
  value: number;
  cancelScheduledValues: (cancelTime: number) => unknown;
  setValueAtTime: (value: number, startTime: number) => unknown;
  linearRampToValueAtTime: (value: number, endTime: number) => unknown;
}

export interface SleepTimerDeps {
  context: Pick<AudioContext, "currentTime">;
  gainParam: GainParamLike;
  onStop: () => void;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

export interface SleepTimerHandle {
  cancel: () => void;
}

export interface ScheduleOptions {
  /** Total time until stop, in seconds, from "now". */
  totalSec: number;
  /** Length of the fade-out at the end. Default 30s. Clamped to <= totalSec. */
  fadeSec?: number;
}

export function scheduleSleepTimer(
  deps: SleepTimerDeps,
  opts: ScheduleOptions,
): SleepTimerHandle {
  const setTimeoutFn = deps.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = deps.clearTimeoutFn ?? clearTimeout;

  const totalSec = Math.max(0, opts.totalSec);
  const fadeSec = Math.max(0, Math.min(opts.fadeSec ?? 30, totalSec));
  const now = deps.context.currentTime;
  const fadeStart = now + (totalSec - fadeSec);
  const fadeEnd = now + totalSec;
  const startValue = deps.gainParam.value;

  // Hold current value until the fade begins, then ramp to silence.
  deps.gainParam.cancelScheduledValues(now);
  deps.gainParam.setValueAtTime(startValue, fadeStart);
  // linearRampToValueAtTime cannot accept 0 as the destination because it
  // produces -Infinity dB internally; use a tiny positive value.
  deps.gainParam.linearRampToValueAtTime(0.0001, fadeEnd);

  const stopHandle = setTimeoutFn(() => {
    deps.onStop();
    // Restore the gain so the next play starts at the same level.
    deps.gainParam.cancelScheduledValues(deps.context.currentTime);
    deps.gainParam.setValueAtTime(startValue, deps.context.currentTime);
  }, totalSec * 1000);

  return {
    cancel: () => {
      clearTimeoutFn(stopHandle);
      deps.gainParam.cancelScheduledValues(deps.context.currentTime);
      deps.gainParam.setValueAtTime(startValue, deps.context.currentTime);
    },
  };
}

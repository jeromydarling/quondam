import { describe, it, expect, vi } from "vitest";
import { scheduleSleepTimer } from "./sleepTimer";

function makeFakeGainParam(initial = 1) {
  const calls: Array<{ method: string; args: number[] }> = [];
  const param = {
    value: initial,
    cancelScheduledValues: vi.fn((t: number) => {
      calls.push({ method: "cancel", args: [t] });
    }),
    setValueAtTime: vi.fn((v: number, t: number) => {
      calls.push({ method: "setValueAtTime", args: [v, t] });
    }),
    linearRampToValueAtTime: vi.fn((v: number, t: number) => {
      calls.push({ method: "ramp", args: [v, t] });
    }),
  };
  return { param, calls };
}

describe("scheduleSleepTimer", () => {
  it("schedules a fade ending at totalSec from now and stops at totalSec", () => {
    vi.useFakeTimers();
    const onStop = vi.fn();
    const { param, calls } = makeFakeGainParam(0.7);
    const ctx = { currentTime: 100 };

    const handle = scheduleSleepTimer(
      { context: ctx, gainParam: param, onStop },
      { totalSec: 600, fadeSec: 30 },
    );

    // Fade hold-then-ramp scheduled correctly
    expect(calls).toEqual([
      { method: "cancel", args: [100] },
      { method: "setValueAtTime", args: [0.7, 100 + 600 - 30] }, // 670
      { method: "ramp", args: [0.0001, 100 + 600] }, // 700
    ]);

    // Hasn't fired yet
    expect(onStop).not.toHaveBeenCalled();

    vi.advanceTimersByTime(600 * 1000);
    expect(onStop).toHaveBeenCalledOnce();

    handle.cancel();
    vi.useRealTimers();
  });

  it("clamps fadeSec to totalSec", () => {
    const onStop = vi.fn();
    const { param, calls } = makeFakeGainParam(1);
    scheduleSleepTimer(
      { context: { currentTime: 0 }, gainParam: param, onStop },
      { totalSec: 5, fadeSec: 30 },
    );
    // Fade should hold from 0 (not negative) and ramp to 5
    expect(calls).toContainEqual({ method: "setValueAtTime", args: [1, 0] });
    expect(calls).toContainEqual({ method: "ramp", args: [0.0001, 5] });
  });

  it("cancel() prevents onStop and restores the gain", () => {
    vi.useFakeTimers();
    const onStop = vi.fn();
    const { param } = makeFakeGainParam(0.5);
    const handle = scheduleSleepTimer(
      { context: { currentTime: 0 }, gainParam: param, onStop },
      { totalSec: 60, fadeSec: 10 },
    );

    handle.cancel();
    vi.advanceTimersByTime(60 * 1000);

    expect(onStop).not.toHaveBeenCalled();
    // After cancel, we expect a setValueAtTime call restoring the original
    expect(param.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    vi.useRealTimers();
  });
});

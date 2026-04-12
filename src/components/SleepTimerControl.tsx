import { useState } from "react";

interface Props {
  active: boolean;
  fadeSec: number;
  onStart: (totalSec: number, fadeSec: number) => void;
  onCancel: () => void;
  onFadeChange: (fadeSec: number) => void;
}

const PRESETS_MIN = [5, 10, 20, 30, 60];

export default function SleepTimerControl({
  active,
  fadeSec,
  onStart,
  onCancel,
  onFadeChange,
}: Props) {
  const [custom, setCustom] = useState("");

  return (
    <div className="rounded-2xl bg-night-900 border border-night-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cream-500">
          Sleep timer
        </h3>
        {active && (
          <button type="button" className="btn px-3" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            className="chip"
            onClick={() => onStart(m * 60, fadeSec)}
          >
            {m} min
          </button>
        ))}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(custom);
            if (Number.isFinite(n) && n > 0) onStart(n * 60, fadeSec);
          }}
        >
          <input
            type="number"
            min={1}
            max={300}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="custom"
            className="w-20 rounded-xl bg-night-800 border border-night-700 px-3 py-2 text-sm"
            aria-label="Custom minutes"
          />
          <button type="submit" className="btn px-3">
            Set
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 text-sm text-cream-300">
        <label htmlFor="fade">Fade-out</label>
        <input
          id="fade"
          type="range"
          min={0}
          max={120}
          step={5}
          value={fadeSec}
          onChange={(e) => onFadeChange(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="tabular-nums w-12 text-right">{fadeSec}s</span>
      </div>
    </div>
  );
}

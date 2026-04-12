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
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="label-eyebrow">Sleep timer</h3>
        {active && (
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={onCancel}>
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
            className="w-20 rounded-xl bg-ink-850 border border-ink-700 px-3 py-2 text-sm font-serif"
            aria-label="Custom minutes"
          />
          <button type="submit" className="btn-ghost px-3 py-2">
            Set
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3 text-sm text-cream-300">
        <label htmlFor="fade" className="font-sans">Fade-out</label>
        <input
          id="fade"
          type="range"
          min={0}
          max={120}
          step={5}
          value={fadeSec}
          onChange={(e) => onFadeChange(Number(e.target.value))}
          className="flex-1 accent-amber"
        />
        <span className="tabular-nums w-12 text-right font-sans text-cream-200">{fadeSec}s</span>
      </div>
    </div>
  );
}

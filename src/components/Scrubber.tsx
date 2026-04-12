import { formatDuration } from "../catalog/filter";

interface Props {
  position: number;
  duration: number;
  onSeek: (sec: number) => void;
}

export default function Scrubber({ position, duration, onSeek }: Props) {
  const max = duration > 0 ? duration : 0;
  return (
    <div className="space-y-1">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(position, max)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full accent-amber"
        aria-label="Seek position"
      />
      <div className="flex justify-between text-xs text-cream-400 tabular-nums font-sans">
        <span>{formatDuration(position)}</span>
        <span>{formatDuration(max)}</span>
      </div>
    </div>
  );
}

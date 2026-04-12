import { useEffect, useRef, useState } from "react";

interface Props {
  analyser: AnalyserNode | null;
  /** Pause the animation when the audio is paused (saves CPU). */
  active: boolean;
}

/**
 * Vintage analog VU meter.
 *
 * Reads time-domain samples from an AnalyserNode at ~animation-frame rate,
 * computes RMS in linear amplitude, converts to dBFS, and applies the
 * classic "VU ballistic" — a slow exponential follower with a ~300 ms time
 * constant — before driving the needle angle.
 *
 * Visuals: a parchment dial face, brass rim with screws, a black scale arc
 * with serif numerals, a red zone past 0 dB, and a thin gold needle that
 * pivots from a brass hub at the bottom. Designed to feel like the meter
 * on a 1960s reel-to-reel.
 */
export default function VuMeter({ analyser, active }: Props) {
  // Needle angle in degrees, where -45 ≈ -20 dB and +45 ≈ +6 dB
  const [angle, setAngle] = useState(-45);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef(0); // smoothed linear RMS, 0..1+

  useEffect(() => {
    if (!analyser || !active) {
      // When paused, gently let the needle fall back to rest.
      let cancelled = false;
      const fallback = () => {
        if (cancelled) return;
        setAngle((a) => {
          const next = a + (-45 - a) * 0.08;
          if (Math.abs(next + 45) < 0.2) return -45;
          rafRef.current = requestAnimationFrame(fallback);
          return next;
        });
      };
      rafRef.current = requestAnimationFrame(fallback);
      return () => {
        cancelled = true;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    const buf = new Uint8Array(analyser.fftSize);
    let last = performance.now();

    const tick = (now: number) => {
      analyser.getByteTimeDomainData(buf);
      // Convert 0..255 (centered ~128) to -1..1 and compute RMS
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);

      // VU ballistic: 300 ms time constant exponential follower
      const dt = Math.max(1, now - last) / 1000;
      last = now;
      const tau = 0.3;
      const alpha = 1 - Math.exp(-dt / tau);
      smoothedRef.current += (rms - smoothedRef.current) * alpha;

      // Convert smoothed RMS to dBFS, then map to needle angle.
      // -∞ dB → -45°, -20 dB → -45°, -3 dB → 0°, 0 dB → +20°, +3 dB → +35°
      const linear = Math.max(smoothedRef.current, 1e-5);
      const db = 20 * Math.log10(linear);
      // Reference 0 VU at -18 dBFS (matches our bedtime target LUFS).
      const vu = db - -18;
      // Map vu (-20..+5) to angle (-45..+40)
      const t = Math.max(-20, Math.min(5, vu));
      const newAngle = (-45 + ((t + 20) / 25) * 85);
      setAngle(newAngle);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active]);

  return (
    <div className="relative mx-auto w-full max-w-sm" aria-label="VU meter">
      <svg viewBox="0 0 320 200" className="w-full h-auto">
        <defs>
          {/* Brass rim gradient */}
          <linearGradient id="brassRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c98c" />
            <stop offset="40%" stopColor="#a4823f" />
            <stop offset="100%" stopColor="#5e4920" />
          </linearGradient>
          {/* Parchment dial face */}
          <radialGradient id="dialFace" cx="50%" cy="80%" r="120%">
            <stop offset="0%" stopColor="#fbf3d4" />
            <stop offset="60%" stopColor="#f3e7c4" />
            <stop offset="100%" stopColor="#e0cf9c" />
          </radialGradient>
          {/* Subtle vignette */}
          <radialGradient id="dialShade" cx="50%" cy="100%" r="100%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </radialGradient>
          {/* Needle gradient */}
          <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1408" />
            <stop offset="100%" stopColor="#3a2c10" />
          </linearGradient>
        </defs>

        {/* Outer brass rim */}
        <rect
          x="6"
          y="6"
          width="308"
          height="188"
          rx="14"
          fill="url(#brassRim)"
        />
        {/* Inner well */}
        <rect
          x="14"
          y="14"
          width="292"
          height="172"
          rx="10"
          fill="#1a1408"
        />
        {/* Parchment face */}
        <rect
          x="20"
          y="20"
          width="280"
          height="160"
          rx="6"
          fill="url(#dialFace)"
        />
        {/* Vignette over face */}
        <rect
          x="20"
          y="20"
          width="280"
          height="160"
          rx="6"
          fill="url(#dialShade)"
        />

        {/* Brass screws at corners */}
        {[
          [16, 16],
          [304, 16],
          [16, 184],
          [304, 184],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3.5" fill="#a4823f" />
            <circle cx={cx} cy={cy} r="3" fill="#5e4920" />
            <line
              x1={cx - 2}
              y1={cy}
              x2={cx + 2}
              y2={cy}
              stroke="#1a1408"
              strokeWidth="0.6"
            />
          </g>
        ))}

        {/* Scale arc — drawn as a path centered at (160, 200), radius 130 */}
        <Arc cx={160} cy={200} r={130} from={-45} to={0} stroke="#1a1408" />
        <Arc cx={160} cy={200} r={130} from={0} to={45} stroke="#a02a1a" />

        {/* Tick marks + labels */}
        {SCALE.map((s) => (
          <Tick
            key={s.db}
            cx={160}
            cy={200}
            r={130}
            angle={s.angle}
            label={s.label}
            major={s.major}
            red={s.db > 0}
          />
        ))}

        {/* "VU" wordmark */}
        <text
          x="160"
          y="160"
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontSize="22"
          fontStyle="italic"
          fill="#1a1408"
          fillOpacity="0.85"
        >
          VU
        </text>
        <text
          x="160"
          y="178"
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontSize="8"
          fill="#1a1408"
          fillOpacity="0.55"
          letterSpacing="2"
        >
          QUONDAM · LONDON
        </text>

        {/* The needle */}
        <g transform={`rotate(${angle} 160 200)`}>
          <line
            x1="160"
            y1="200"
            x2="160"
            y2="55"
            stroke="url(#needleGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Counter-balance below pivot */}
          <line
            x1="160"
            y1="200"
            x2="160"
            y2="220"
            stroke="#1a1408"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Brass hub on top of needle pivot */}
        <circle cx="160" cy="200" r="9" fill="url(#brassRim)" />
        <circle cx="160" cy="200" r="6" fill="#5e4920" />
        <circle cx="160" cy="200" r="2" fill="#1a1408" />
      </svg>
    </div>
  );
}

const SCALE: Array<{
  db: number;
  angle: number;
  label: string;
  major: boolean;
}> = [
  { db: -20, angle: -45, label: "-20", major: true },
  { db: -10, angle: -28, label: "-10", major: true },
  { db: -7, angle: -19, label: "-7", major: false },
  { db: -5, angle: -13, label: "-5", major: false },
  { db: -3, angle: -7, label: "-3", major: true },
  { db: -1, angle: -2, label: "-1", major: false },
  { db: 0, angle: 0, label: "0", major: true },
  { db: 1, angle: 8, label: "+1", major: false },
  { db: 3, angle: 22, label: "+3", major: true },
];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  // 0° points up (toward decreasing y). Negative angles are to the left.
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function Arc({
  cx,
  cy,
  r,
  from,
  to,
  stroke,
}: {
  cx: number;
  cy: number;
  r: number;
  from: number;
  to: number;
  stroke: string;
}) {
  const start = polar(cx, cy, r, from);
  const end = polar(cx, cy, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
  return <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" />;
}

function Tick({
  cx,
  cy,
  r,
  angle,
  label,
  major,
  red,
}: {
  cx: number;
  cy: number;
  r: number;
  angle: number;
  label: string;
  major: boolean;
  red: boolean;
}) {
  const outer = polar(cx, cy, r, angle);
  const inner = polar(cx, cy, r - (major ? 9 : 5), angle);
  const labelPt = polar(cx, cy, r - 18, angle);
  return (
    <g>
      <line
        x1={outer.x}
        y1={outer.y}
        x2={inner.x}
        y2={inner.y}
        stroke={red ? "#a02a1a" : "#1a1408"}
        strokeWidth={major ? 1.6 : 1}
      />
      {major && (
        <text
          x={labelPt.x}
          y={labelPt.y + 3}
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontSize="9"
          fill={red ? "#a02a1a" : "#1a1408"}
        >
          {label}
        </text>
      )}
    </g>
  );
}

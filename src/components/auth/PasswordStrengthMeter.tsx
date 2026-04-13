import { scorePassword } from "../../auth/passwordStrength";

interface Props {
  password: string;
}

/**
 * 5-bar visual meter driven by the pure scorePassword() function.
 * Shows the textual label and a single improvement hint underneath.
 */
export default function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color, hint } = scorePassword(password);
  // 5 bars, 0..4 score = how many lit. We always show 5 segments.
  const lit = score + (password ? 1 : 0); // light up at least one once anything is typed

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < lit ? color : "bg-ink-700"
            }`}
          />
        ))}
      </div>
      {password && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-serif italic text-cream-200">{label}</span>
          {hint && (
            <span className="font-serif text-cream-400 text-[11px] text-right ml-3">
              {hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

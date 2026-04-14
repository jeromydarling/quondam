import { useStore } from "../state/store";
import { crosScholaUrl } from "../lib/cros";

/**
 * First-impression panel shown on the Library after sign-in. Pitches
 * CROS Schola as the broader home for homeschool families. Dismissible
 * once — dismissal persists to localStorage (and will move to the user
 * record under the Lovable backend).
 */
export default function WelcomeCard() {
  const dismissed = useStore((s) => s.welcomeDismissed);
  const dismissWelcome = useStore((s) => s.dismissWelcome);

  if (dismissed) return null;

  return (
    <div className="panel p-6 sm:p-8 space-y-4 border-l-4 border-l-amber/70 relative">
      <button
        type="button"
        onClick={dismissWelcome}
        aria-label="Dismiss welcome"
        className="absolute top-3 right-3 min-w-tap min-h-tap flex items-center justify-center text-cream-400 hover:text-cream-100 text-xl"
      >
        ×
      </button>
      <p className="label-eyebrow">Welcome</p>
      <h3
        className="font-serif text-2xl sm:text-3xl text-cream-50 text-balance max-w-prose"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500' }}
      >
        A quiet library for bedtime, brought to you by CROS Schola.
      </h3>
      <p className="body-prose">
        CROS Schola is a home for homeschool families who care about the
        small rhythms of the day — bedtime, breakfast, the way Tuesday
        afternoon gets spent. quondam is our gift to the nighttime part.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href={crosScholaUrl("welcome")}
          target="_blank"
          rel="noreferrer"
          className="btn-accent"
          onClick={() => dismissWelcome()}
        >
          Meet CROS Schola →
        </a>
        <button type="button" className="btn-ghost" onClick={dismissWelcome}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

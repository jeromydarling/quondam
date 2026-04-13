import { Link } from "react-router-dom";

interface Props {
  /** Headline shown to anonymous users. */
  title?: string;
  /** Optional supporting line. */
  subtitle?: string;
  /** Compact variant fits in small slots like below the player scrubber. */
  size?: "compact" | "panel";
}

/**
 * Inline call-to-action shown in place of features that anonymous users
 * don't have access to. Free → sign up free, no payment, full app.
 */
export default function SignInCTA({
  title = "Sign in for the full library, sleep timer, favorites, and more.",
  subtitle = "It's free — no payment, no card.",
  size = "panel",
}: Props) {
  if (size === "compact") {
    return (
      <div className="text-center">
        <p className="font-serif italic text-cream-300 text-sm mb-2">
          {title}
        </p>
        <Link to="/sign-up" className="btn-accent">
          Sign in free
        </Link>
      </div>
    );
  }

  return (
    <div className="panel p-6 sm:p-8 text-center space-y-3 border-l-4 border-l-amber/60">
      <h3
        className="font-serif text-xl sm:text-2xl text-cream-50 text-balance max-w-prose mx-auto"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500' }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="font-serif italic text-cream-300 text-sm">{subtitle}</p>
      )}
      <div className="flex gap-3 justify-center pt-2">
        <Link to="/sign-up" className="btn-accent">
          Sign up
        </Link>
        <Link to="/sign-in" className="btn-ghost">
          Sign in
        </Link>
      </div>
    </div>
  );
}

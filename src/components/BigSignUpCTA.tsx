import { Link } from "react-router-dom";

/**
 * Prominent sign-up conversion banner shown to anonymous users at the
 * top of the Library. Big, warm, value-prop-heavy. This is the primary
 * funnel surface — the small `SignInCTA` is still used in tighter slots
 * (Tonight wall, Player supporting ask).
 */
export default function BigSignUpCTA() {
  return (
    <section
      aria-label="Sign up"
      className="panel p-6 sm:p-10 space-y-6 border-l-4 border-l-amber"
    >
      <div className="space-y-3">
        <p className="label-eyebrow">Free, forever</p>
        <h2
          className="font-serif text-3xl sm:text-4xl text-cream-50 leading-tight tracking-tight text-balance max-w-prose"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70, "wght" 500' }}
        >
          Save what you love. Build tonight's queue. Sync everywhere.
        </h2>
        <p className="body-prose">
          Sign up free to turn quondam into your bedtime home base.
        </p>
      </div>

      <ul className="space-y-2.5 font-serif text-cream-100">
        <Reason glyph="♥">
          Favorite the stories your family comes back to
        </Reason>
        <Reason glyph="★">
          Build a Tonight shortlist for the week ahead
        </Reason>
        <Reason glyph="↻">
          Sync across every device you use
        </Reason>
      </ul>

      <p className="font-serif italic text-cream-400 text-sm">
        Free forever. No card, no ads.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/sign-up"
          className="btn-accent text-base px-6 py-3"
        >
          Sign up free →
        </Link>
        <Link to="/sign-in" className="btn-ghost">
          Sign in
        </Link>
      </div>
    </section>
  );
}

function Reason({
  glyph,
  children,
}: {
  glyph: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-baseline gap-3">
      <span
        aria-hidden
        className="text-amber text-lg min-w-[1.25rem] text-center"
      >
        {glyph}
      </span>
      <span className="text-cream-100">{children}</span>
    </li>
  );
}

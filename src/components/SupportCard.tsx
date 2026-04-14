import { crosScholaUrl } from "../lib/cros";

interface Props {
  /**
   * "panel" is the full version shown on Account. "compact" is a leaner
   * inline version for surfaces where space is tight.
   */
  size?: "panel" | "compact";
}

/**
 * Soft ask shown on the Account screen (and optionally elsewhere). Uses
 * the exact copy requested: "Like this app? Support our work. This
 * allows us to continue adding more content and functionality."
 *
 * Button links to CROS Schola with a utm_medium=support tag so click
 * attribution is visible in the eventual analytics.
 */
export default function SupportCard({ size = "panel" }: Props) {
  if (size === "compact") {
    return (
      <div className="text-center space-y-2">
        <p className="font-serif italic text-cream-300 text-sm max-w-prose mx-auto">
          Like this app? Support our work. This allows us to continue
          adding more content and functionality.
        </p>
        <a
          href={crosScholaUrl("support")}
          target="_blank"
          rel="noreferrer"
          className="btn-accent"
        >
          Support us →
        </a>
      </div>
    );
  }

  return (
    <div className="panel p-6 space-y-4 border-l-4 border-l-cream-300/50">
      <h3
        className="font-serif text-2xl text-cream-50"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60, "wght" 500' }}
      >
        Like this app?
      </h3>
      <p className="body-prose">
        Support our work. This allows us to continue adding more content
        and functionality.
      </p>
      <a
        href={crosScholaUrl("support")}
        target="_blank"
        rel="noreferrer"
        className="btn-accent"
      >
        Support us →
      </a>
    </div>
  );
}

// CROS Schola funnel destinations. Centralized here so the marketing URL
// can be tuned without grepping the codebase — change the constant and
// every outbound link (footer, welcome card, support card) updates.

/**
 * Build a CROS Schola URL with UTM tracking so we can measure which
 * surface of quondam is driving clicks.
 *
 * @param source which surface ("footer" | "welcome" | "support" | ...)
 */
export function crosScholaUrl(source: string): string {
  const params = new URLSearchParams({
    utm_source: "quondam",
    utm_medium: source,
    utm_campaign: "funnel",
  });
  return `https://myschola.app/?${params.toString()}`;
}

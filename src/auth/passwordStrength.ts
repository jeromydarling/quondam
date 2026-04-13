// Lightweight password-strength scorer.
//
// Returns 0..4 plus a label and a CSS color, suitable for a 5-bar meter.
// This is intentionally NOT zxcvbn — we trade dictionary detection for
// zero deps and a few hundred bytes. The goal is a useful visual hint, not
// a security gate. The hard floor for "you may register" lives in
// validation.ts (`isPasswordStrongEnough`).

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: StrengthScore;
  label: string;
  /** Tailwind background color class for the meter bars. */
  color: string;
  /** Short improvement hint, when the password is below "Strong". */
  hint: string;
}

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "iloveyou",
  "admin",
  "abc123",
  "monkey",
  "dragon",
]);

export function scorePassword(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "bg-ink-700",
      hint: "",
    };
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return {
      score: 0,
      label: "Too common",
      color: "bg-red-600",
      hint: "Pick something less guessable.",
    };
  }

  let points = 0;
  // Length is by far the most important factor.
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;

  // Character variety.
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;
  if (variety >= 2) points += 1;
  if (variety >= 3) points += 1;
  if (variety === 4) points += 1;

  // Penalties for patterns.
  if (/^(.)\1+$/.test(password)) points -= 2; // all one character
  if (/(.)\1{2,}/.test(password)) points -= 1; // 3+ of same char in a row
  if (/^[0-9]+$/.test(password)) points -= 1; // digits only
  if (/^[a-zA-Z]+$/.test(password)) points -= 1; // letters only

  const score = Math.max(0, Math.min(4, points)) as StrengthScore;

  const presets: Record<
    StrengthScore,
    Pick<PasswordStrength, "label" | "color" | "hint">
  > = {
    0: {
      label: "Very weak",
      color: "bg-red-600",
      hint: "Try a longer password with letters and numbers.",
    },
    1: {
      label: "Weak",
      color: "bg-orange-500",
      hint: "Add length, mixed case, or a symbol.",
    },
    2: {
      label: "Fair",
      color: "bg-yellow-500",
      hint: "A bit longer or one more character type would help.",
    },
    3: {
      label: "Strong",
      color: "bg-lime-500",
      hint: "",
    },
    4: {
      label: "Very strong",
      color: "bg-emerald-500",
      hint: "",
    },
  };
  return { score, ...presets[score] };
}

// Pure validators for auth inputs. Tested in validation.test.ts.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/**
 * Minimum threshold to be allowed to register: 8+ chars, at least one
 * letter and at least one number. The visual strength meter goes beyond
 * this — it scores how strong the password is — but this is the floor we
 * enforce.
 */
export function isPasswordStrongEnough(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

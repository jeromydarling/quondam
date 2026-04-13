// Types shared by the auth swap point and the rest of the app.
//
// There are no tiers in quondam — the app is free. The single distinction
// is whether a user is signed in. Signed-in users get the full experience;
// anonymous users see a deliberately bare teaser.

export type AuthProvider = "email" | "google";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string; // ISO
  authProvider: AuthProvider;
}

export type AuthErrorCode =
  | "invalid-credentials"
  | "email-in-use"
  | "weak-password"
  | "invalid-email"
  | "not-signed-in"
  | "user-not-found"
  | "wrong-password"
  | "network"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthResult<T = User> =
  | { ok: true; value: T }
  | { ok: false; error: AuthError };

export function ok<T>(value: T): AuthResult<T> {
  return { ok: true, value };
}

export function err<T = User>(
  code: AuthErrorCode,
  message: string,
): AuthResult<T> {
  return { ok: false, error: { code, message } };
}

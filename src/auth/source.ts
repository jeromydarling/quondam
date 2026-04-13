// *** SWAP POINT ***
//
// This is the only file that needs to change when Lovable.app wires up a
// real auth backend (Supabase, Firebase, or whatever they prefer). Today
// it's a localStorage-backed stub so the entire UX works end-to-end in
// dev/demo without a server. Replace `localStorageBackend` with a real
// implementation of `AuthBackend` and the rest of the app keeps working.
//
// SECURITY NOTE: this stub stores passwords in plaintext in localStorage.
// That is obviously not safe and is only acceptable because (a) data never
// leaves the user's own browser and (b) Lovable will replace this whole
// file. Do not ship this to production as-is.

import {
  type AuthResult,
  type User,
  err,
  ok,
} from "./types";
import { isValidEmail, isPasswordStrongEnough } from "./validation";

export interface AuthBackend {
  /** Get the currently signed-in user, or null. */
  getCurrentUser(): Promise<User | null>;
  /** Subscribe to auth state changes. Returns an unsubscribe function. */
  onAuthChange(cb: (user: User | null) => void): () => void;

  signUpWithEmail(email: string, password: string): Promise<AuthResult>;
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;

  changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<AuthResult<true>>;
  changeEmail(newEmail: string, password: string): Promise<AuthResult>;
  resendVerification(): Promise<AuthResult<true>>;
  markVerified(): Promise<AuthResult>; // simulates clicking the verify link
  resetPasswordRequest(email: string): Promise<AuthResult<true>>;
  deleteAccount(password: string): Promise<AuthResult<true>>;
}

// ---------- localStorage stub backend ----------

interface StoredUser extends User {
  // Stored only in this stub; a real backend never sends the password hash
  // back to the client.
  password: string;
}

interface StorageShape {
  users: StoredUser[];
  currentUserId: string | null;
}

const STORAGE_KEY = "quondam-auth-stub-v1";

function loadStorage(): StorageShape {
  if (typeof localStorage === "undefined") {
    return { users: [], currentUserId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [], currentUserId: null };
    return JSON.parse(raw) as StorageShape;
  } catch {
    return { users: [], currentUserId: null };
  }
}

function saveStorage(state: StorageShape): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function publicUser(stored: StoredUser): User {
  // Strip password before exposing.
  const { password: _drop, ...rest } = stored;
  return rest;
}

class LocalStorageAuthBackend implements AuthBackend {
  private listeners = new Set<(user: User | null) => void>();

  private notify(): void {
    const user = this.currentUserSync();
    this.listeners.forEach((cb) => cb(user));
  }

  private currentUserSync(): User | null {
    const state = loadStorage();
    if (!state.currentUserId) return null;
    const stored = state.users.find((u) => u.id === state.currentUserId);
    return stored ? publicUser(stored) : null;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUserSync();
  }

  onAuthChange(cb: (user: User | null) => void): () => void {
    this.listeners.add(cb);
    // Fire once with the current value.
    cb(this.currentUserSync());
    return () => this.listeners.delete(cb);
  }

  async signUpWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResult> {
    if (!isValidEmail(email)) {
      return err("invalid-email", "That doesn't look like a valid email.");
    }
    if (!isPasswordStrongEnough(password)) {
      return err(
        "weak-password",
        "Password must be at least 8 characters and include a mix of letters and numbers.",
      );
    }
    const state = loadStorage();
    const normalized = email.trim().toLowerCase();
    if (state.users.some((u) => u.email === normalized)) {
      return err("email-in-use", "An account with that email already exists.");
    }
    const stored: StoredUser = {
      id: `user_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      email: normalized,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      authProvider: "email",
      password,
    };
    state.users.push(stored);
    state.currentUserId = stored.id;
    saveStorage(state);
    this.notify();
    return ok(publicUser(stored));
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const state = loadStorage();
    const normalized = email.trim().toLowerCase();
    const user = state.users.find((u) => u.email === normalized);
    if (!user) {
      return err("user-not-found", "No account with that email.");
    }
    if (user.password !== password) {
      return err("wrong-password", "That password is incorrect.");
    }
    state.currentUserId = user.id;
    saveStorage(state);
    this.notify();
    return ok(publicUser(user));
  }

  async signInWithGoogle(): Promise<AuthResult> {
    // Stub: simulates a Google account by minting a deterministic
    // demo user. Lovable replaces this with the real OAuth flow.
    const state = loadStorage();
    const fakeEmail = "demo.parent@gmail.com";
    let user = state.users.find((u) => u.email === fakeEmail);
    if (!user) {
      user = {
        id: `user_google_demo`,
        email: fakeEmail,
        emailVerified: true, // Google accounts are pre-verified
        createdAt: new Date().toISOString(),
        authProvider: "google",
        password: "", // unused for OAuth users
      };
      state.users.push(user);
    }
    state.currentUserId = user.id;
    saveStorage(state);
    this.notify();
    return ok(publicUser(user));
  }

  async signOut(): Promise<void> {
    const state = loadStorage();
    state.currentUserId = null;
    saveStorage(state);
    this.notify();
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<AuthResult<true>> {
    const state = loadStorage();
    if (!state.currentUserId) {
      return err("not-signed-in", "You're not signed in.");
    }
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return err("not-signed-in", "Account not found.");
    if (user.authProvider === "google") {
      return err(
        "unknown",
        "Google accounts manage their password through Google.",
      );
    }
    if (user.password !== oldPassword) {
      return err("wrong-password", "Current password is incorrect.");
    }
    if (!isPasswordStrongEnough(newPassword)) {
      return err(
        "weak-password",
        "Password must be at least 8 characters and include a mix of letters and numbers.",
      );
    }
    user.password = newPassword;
    saveStorage(state);
    return ok(true);
  }

  async changeEmail(
    newEmail: string,
    password: string,
  ): Promise<AuthResult> {
    if (!isValidEmail(newEmail)) {
      return err("invalid-email", "That doesn't look like a valid email.");
    }
    const state = loadStorage();
    if (!state.currentUserId) {
      return err("not-signed-in", "You're not signed in.");
    }
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return err("not-signed-in", "Account not found.");
    if (user.authProvider === "email" && user.password !== password) {
      return err("wrong-password", "Password is incorrect.");
    }
    const normalized = newEmail.trim().toLowerCase();
    if (
      state.users.some(
        (u) => u.email === normalized && u.id !== user.id,
      )
    ) {
      return err("email-in-use", "Another account already uses that email.");
    }
    user.email = normalized;
    user.emailVerified = false;
    saveStorage(state);
    this.notify();
    return ok(publicUser(user));
  }

  async resendVerification(): Promise<AuthResult<true>> {
    // Stub: pretends to send. The user can call markVerified() to simulate
    // clicking the link.
    const state = loadStorage();
    if (!state.currentUserId) {
      return err("not-signed-in", "You're not signed in.");
    }
    return ok(true);
  }

  async markVerified(): Promise<AuthResult> {
    const state = loadStorage();
    if (!state.currentUserId) {
      return err("not-signed-in", "You're not signed in.");
    }
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return err("not-signed-in", "Account not found.");
    user.emailVerified = true;
    saveStorage(state);
    this.notify();
    return ok(publicUser(user));
  }

  async resetPasswordRequest(_email: string): Promise<AuthResult<true>> {
    // Stub: pretends to send a reset link. Lovable will wire this to a
    // real email service.
    return ok(true);
  }

  async deleteAccount(password: string): Promise<AuthResult<true>> {
    const state = loadStorage();
    if (!state.currentUserId) {
      return err("not-signed-in", "You're not signed in.");
    }
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user) return err("not-signed-in", "Account not found.");
    if (user.authProvider === "email" && user.password !== password) {
      return err("wrong-password", "Password is incorrect.");
    }
    state.users = state.users.filter((u) => u.id !== user.id);
    state.currentUserId = null;
    saveStorage(state);
    this.notify();
    return ok(true);
  }
}

export const authBackend: AuthBackend = new LocalStorageAuthBackend();

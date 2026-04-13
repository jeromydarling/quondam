import { describe, it, expect, beforeEach } from "vitest";
import { authBackend } from "./source";

// jsdom provides localStorage. Each test starts from a clean slate.
beforeEach(async () => {
  localStorage.clear();
  // Force a fresh notify so the in-memory listener cache reflects empty state.
  await authBackend.signOut();
});

describe("LocalStorageAuthBackend", () => {
  it("rejects sign-up with invalid email", async () => {
    const r = await authBackend.signUpWithEmail("bogus", "Correct1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("invalid-email");
  });

  it("rejects sign-up with weak password", async () => {
    const r = await authBackend.signUpWithEmail("a@b.co", "weak");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("weak-password");
  });

  it("signs a new user up and reports them as current", async () => {
    const r = await authBackend.signUpWithEmail("a@b.co", "Correct1");
    expect(r.ok).toBe(true);
    const cur = await authBackend.getCurrentUser();
    expect(cur?.email).toBe("a@b.co");
    expect(cur?.emailVerified).toBe(false);
    expect(cur?.authProvider).toBe("email");
  });

  it("refuses duplicate sign-ups", async () => {
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    await authBackend.signOut();
    const r = await authBackend.signUpWithEmail("a@b.co", "Correct1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("email-in-use");
  });

  it("signs in with the right password and rejects the wrong one", async () => {
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    await authBackend.signOut();
    const wrong = await authBackend.signInWithEmail("a@b.co", "WrongOne");
    expect(wrong.ok).toBe(false);
    const right = await authBackend.signInWithEmail("a@b.co", "Correct1");
    expect(right.ok).toBe(true);
  });

  it("changes password end-to-end", async () => {
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    const change = await authBackend.changePassword("Correct1", "NewPass99");
    expect(change.ok).toBe(true);
    await authBackend.signOut();
    const oldFails = await authBackend.signInWithEmail("a@b.co", "Correct1");
    expect(oldFails.ok).toBe(false);
    const newWorks = await authBackend.signInWithEmail("a@b.co", "NewPass99");
    expect(newWorks.ok).toBe(true);
  });

  it("marks email verified when simulated", async () => {
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    expect((await authBackend.getCurrentUser())?.emailVerified).toBe(false);
    await authBackend.markVerified();
    expect((await authBackend.getCurrentUser())?.emailVerified).toBe(true);
  });

  it("notifies subscribers on auth state changes", async () => {
    const seen: Array<string | null> = [];
    const unsub = authBackend.onAuthChange((u) => seen.push(u?.email ?? null));
    // Initial fire is null after the beforeEach signOut.
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    await authBackend.signOut();
    unsub();
    // Last seen value should be null (signed out).
    expect(seen[seen.length - 1]).toBeNull();
    expect(seen).toContain("a@b.co");
  });

  it("deletes the account and clears current user", async () => {
    await authBackend.signUpWithEmail("a@b.co", "Correct1");
    const r = await authBackend.deleteAccount("Correct1");
    expect(r.ok).toBe(true);
    expect(await authBackend.getCurrentUser()).toBeNull();
  });
});

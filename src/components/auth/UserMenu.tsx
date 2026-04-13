import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

/**
 * Header user widget. Signed out → "Sign in" link. Signed in → button
 * showing the email's first letter that opens a small dropdown with
 * the email, a link to /account, and Sign out.
 */
export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/sign-in"
        className="px-4 py-2 rounded-lg text-sm min-h-tap inline-flex items-center bg-amber text-ink-950 hover:bg-cream-100 font-sans tracking-wide"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.email[0] ?? "?").toUpperCase();

  async function onSignOut() {
    setOpen(false);
    await signOut();
    navigate("/");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.email}`}
        className="min-h-tap min-w-tap rounded-full bg-amber text-ink-950 font-serif text-base font-semibold flex items-center justify-center shadow-cover"
        style={{ fontVariationSettings: '"opsz" 14, "wght" 600' }}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl bg-ink-850 border border-ink-700 shadow-cover overflow-hidden z-30"
        >
          <div className="px-4 py-3 border-b border-ink-700">
            <p className="label-eyebrow">Signed in as</p>
            <p className="font-serif text-cream-100 truncate">{user.email}</p>
            {!user.emailVerified && (
              <p className="text-xs text-amber-dim italic mt-1">
                Email not yet verified
              </p>
            )}
          </div>
          <Link
            to="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 font-serif text-cream-100 hover:bg-ink-800"
          >
            Account
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="w-full text-left px-4 py-3 font-serif text-cream-100 hover:bg-ink-800 border-t border-ink-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

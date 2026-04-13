import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

interface Props {
  /** Text label, e.g. "Continue with Google" or "Sign up with Google". */
  label?: string;
}

/**
 * Calls the auth backend's signInWithGoogle() and routes home on success.
 * The current backend stub fakes a Google account; Lovable replaces it
 * with the real OAuth redirect flow without changing this component.
 */
export default function GoogleButton({
  label = "Continue with Google",
}: Props) {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.error.message);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 rounded-xl
                   bg-cream-50 text-ink-900 font-medium px-4 py-3 min-h-tap
                   hover:bg-cream-100 disabled:opacity-60 disabled:pointer-events-none
                   transition-colors border border-cream-200 shadow-sm"
      >
        <GoogleG />
        <span className="font-serif">{busy ? "Connecting…" : label}</span>
      </button>
      {error && (
        <p className="text-sm text-red-400 font-serif text-center">{error}</p>
      )}
    </div>
  );
}

function GoogleG() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.46 2.1 14.97 1 12 1A10.997 10.997 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

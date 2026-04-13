import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import PasswordField from "../components/auth/PasswordField";
import GoogleButton from "../components/auth/GoogleButton";

export default function SignIn() {
  const { user, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await signInWithEmail(email, password);
    setBusy(false);
    if (result.ok) navigate("/");
    else setError(result.error.message);
  }

  return (
    <section className="max-w-md mx-auto space-y-8">
      <header className="space-y-2 text-center">
        <p className="label-eyebrow">Welcome back</p>
        <h2 className="display-title">Sign in.</h2>
      </header>

      <GoogleButton label="Sign in with Google" />

      <Divider>or with email</Divider>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block label-eyebrow text-cream-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-base font-serif
                       focus:outline-none focus:border-amber placeholder:text-cream-500"
          />
        </div>
        <PasswordField
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="text-sm text-red-400 font-serif text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-accent w-full"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="text-center space-y-2 text-sm">
        <p className="font-serif text-cream-300">
          New to quondam?{" "}
          <Link to="/sign-up" className="text-amber hover:underline">
            Create an account
          </Link>
        </p>
        <p className="font-serif text-cream-400">
          <Link to="/forgot-password" className="hover:text-cream-200 underline decoration-cream-500/40">
            Forgot your password?
          </Link>
        </p>
      </div>
    </section>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-ink-700" />
      <span className="label-eyebrow normal-case tracking-wide text-cream-400">
        {children}
      </span>
      <div className="flex-1 border-t border-ink-700" />
    </div>
  );
}

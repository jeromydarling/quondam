import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import PasswordField from "../components/auth/PasswordField";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";
import GoogleButton from "../components/auth/GoogleButton";

export default function SignUp() {
  const { user, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const result = await signUpWithEmail(email, password);
    setBusy(false);
    if (result.ok) navigate("/");
    else setError(result.error.message);
  }

  return (
    <section className="max-w-md mx-auto space-y-8">
      <header className="space-y-2 text-center">
        <p className="label-eyebrow">Free forever</p>
        <h2 className="display-title">Create your account.</h2>
        <p className="font-serif italic text-cream-300">
          No payment, no card. Just bedtime stories.
        </p>
      </header>

      <GoogleButton label="Sign up with Google" />

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
        <div className="space-y-2">
          <PasswordField
            label="Password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <PasswordField
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && (
          <p className="text-sm text-red-400 font-serif text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-accent w-full"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm font-serif text-cream-300">
        Already have an account?{" "}
        <Link to="/sign-in" className="text-amber hover:underline">
          Sign in
        </Link>
      </p>
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

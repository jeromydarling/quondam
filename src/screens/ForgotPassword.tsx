import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ForgotPassword() {
  const { resetPasswordRequest } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await resetPasswordRequest(email);
    setBusy(false);
    setSent(true);
  }

  return (
    <section className="max-w-md mx-auto space-y-8">
      <header className="space-y-2 text-center">
        <p className="label-eyebrow">Reset password</p>
        <h2 className="display-title">Forgot your password?</h2>
      </header>

      {sent ? (
        <div className="panel p-6 space-y-4 text-center">
          <p className="font-serif text-cream-100">
            If an account exists for <span className="italic">{email}</span>,
            we've sent a reset link to that address.
          </p>
          <p className="font-serif text-sm text-cream-400 italic">
            Check your inbox (and spam folder).
          </p>
          <Link to="/sign-in" className="btn-accent">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="font-serif text-cream-300 text-center">
            Enter your account email and we'll send you a link to choose a
            new password.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="fp-email" className="block label-eyebrow text-cream-300">
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-base font-serif focus:outline-none focus:border-amber"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-accent w-full">
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-center text-sm font-serif text-cream-300">
            <Link to="/sign-in" className="text-amber hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}

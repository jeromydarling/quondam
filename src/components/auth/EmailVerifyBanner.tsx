import { useState } from "react";
import { useAuth } from "../../auth/useAuth";

/**
 * Persistent banner shown when the signed-in user has not verified their
 * email. The current backend stub doesn't actually send mail; clicking
 * "I've verified" simulates a successful verify, and "Resend" is a no-op
 * that surfaces a confirmation message. Lovable wires both to a real
 * email service without changing this component.
 */
export default function EmailVerifyBanner() {
  const { user, resendVerification, markVerified } = useAuth();
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified) return null;

  async function onResend() {
    setBusy(true);
    await resendVerification();
    setBusy(false);
    setResent(true);
  }

  async function onVerify() {
    setBusy(true);
    await markVerified();
    setBusy(false);
  }

  return (
    <div className="border-b border-amber-dim bg-ink-850/80">
      <div className="max-w-4xl mx-auto px-5 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="font-serif italic text-cream-200 text-sm flex-1 min-w-[12rem]">
          {resent
            ? "Verification email sent. Check your inbox."
            : "Please verify your email address."}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="text-xs font-sans tracking-wide text-cream-300 hover:text-amber underline decoration-amber/40 px-2 py-1 disabled:opacity-50"
          >
            Resend
          </button>
          <button
            type="button"
            onClick={onVerify}
            disabled={busy}
            className="text-xs font-sans tracking-wide text-ink-950 bg-amber hover:bg-cream-100 rounded-lg px-3 py-1.5 disabled:opacity-50"
          >
            I've verified
          </button>
        </div>
      </div>
    </div>
  );
}

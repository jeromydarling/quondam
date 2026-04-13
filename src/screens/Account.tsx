import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import PasswordField from "../components/auth/PasswordField";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";

type Status = { kind: "ok" | "error"; message: string } | null;

export default function Account() {
  const {
    user,
    signOut,
    changePassword,
    changeEmail,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/sign-in" replace />;

  return (
    <section className="max-w-xl mx-auto space-y-10">
      <header className="space-y-2">
        <p className="label-eyebrow">Account</p>
        <h2 className="display-title">Your account.</h2>
      </header>

      <div className="panel p-6 space-y-3">
        <p className="label-eyebrow">Signed in as</p>
        <p className="font-serif text-xl text-cream-50 truncate">
          {user.email}
        </p>
        <p className="font-serif text-sm text-cream-400 italic">
          {user.authProvider === "google"
            ? "Google account"
            : user.emailVerified
              ? "Email verified"
              : "Email not yet verified"}
        </p>
      </div>

      {user.authProvider === "email" && <ChangeEmailCard />}
      {user.authProvider === "email" && <ChangePasswordCard />}

      <div className="panel p-6 space-y-4">
        <h3 className="label-eyebrow">Sign out</h3>
        <p className="font-serif text-cream-300 text-sm">
          Sign out of this device. Your favorites and Tonight shortlist
          stay safe.
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Sign out
        </button>
      </div>

      <DeleteAccountCard
        onDelete={async (password) => {
          const result = await deleteAccount(password);
          if (result.ok) navigate("/");
          return result;
        }}
        requirePassword={user.authProvider === "email"}
      />
    </section>
  );

  function ChangeEmailCard() {
    const [newEmail, setNewEmail] = useState("");
    const [pw, setPw] = useState("");
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    async function onSubmit(e: FormEvent) {
      e.preventDefault();
      setBusy(true);
      const result = await changeEmail(newEmail, pw);
      setBusy(false);
      if (result.ok) {
        setStatus({
          kind: "ok",
          message: "Email updated. Please verify the new address.",
        });
        setNewEmail("");
        setPw("");
      } else {
        setStatus({ kind: "error", message: result.error.message });
      }
    }

    return (
      <form onSubmit={onSubmit} className="panel p-6 space-y-4">
        <h3 className="label-eyebrow">Change email</h3>
        <div className="space-y-1.5">
          <label htmlFor="acct-new-email" className="block label-eyebrow text-cream-300">
            New email
          </label>
          <input
            id="acct-new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-base font-serif focus:outline-none focus:border-amber"
          />
        </div>
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        <StatusLine status={status} />
        <button type="submit" disabled={busy} className="btn-accent">
          {busy ? "Updating…" : "Update email"}
        </button>
      </form>
    );
  }

  function ChangePasswordCard() {
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    async function onSubmit(e: FormEvent) {
      e.preventDefault();
      if (newPw !== confirm) {
        setStatus({ kind: "error", message: "New passwords don't match." });
        return;
      }
      setBusy(true);
      const result = await changePassword(oldPw, newPw);
      setBusy(false);
      if (result.ok) {
        setStatus({ kind: "ok", message: "Password updated." });
        setOldPw("");
        setNewPw("");
        setConfirm("");
      } else {
        setStatus({ kind: "error", message: result.error.message });
      }
    }

    return (
      <form onSubmit={onSubmit} className="panel p-6 space-y-4">
        <h3 className="label-eyebrow">Change password</h3>
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={oldPw}
          onChange={(e) => setOldPw(e.target.value)}
          required
        />
        <div className="space-y-2">
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
          <PasswordStrengthMeter password={newPw} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <StatusLine status={status} />
        <button type="submit" disabled={busy} className="btn-accent">
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    );
  }
}

function DeleteAccountCard({
  onDelete,
  requirePassword,
}: {
  onDelete: (password: string) => Promise<{ ok: boolean; error?: { message: string } }>;
  requirePassword: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setBusy(true);
    const result = await onDelete(pw);
    setBusy(false);
    if (!result.ok) setError(result.error?.message ?? "Could not delete.");
  }

  return (
    <div className="panel p-6 space-y-4 border-l-4 border-l-red-500/50">
      <h3 className="label-eyebrow text-red-300">Delete account</h3>
      <p className="font-serif text-cream-300 text-sm">
        Permanently remove your account, favorites, and Tonight shortlist.
        This cannot be undone.
      </p>
      {!open ? (
        <button
          type="button"
          className="btn-ghost text-red-300 border-red-500/40 hover:bg-red-950/20"
          onClick={() => setOpen(true)}
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-3">
          {requirePassword && (
            <PasswordField
              label="Confirm with your password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          )}
          {error && (
            <p className="text-sm text-red-400 font-serif">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy || (requirePassword && !pw)}
              className="btn bg-red-600 text-cream-50 hover:bg-red-500 border-red-700"
            >
              {busy ? "Deleting…" : "Yes, delete forever"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPw("");
                setError(null);
              }}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={`text-sm font-serif ${
        status.kind === "ok" ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {status.message}
    </p>
  );
}

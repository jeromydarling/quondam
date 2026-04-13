import { useState, type InputHTMLAttributes } from "react";

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

/**
 * Text input with a show/hide toggle on the right side. The toggle is a
 * real button (not a div) for accessibility, and aria-label flips between
 * "Show password" and "Hide password" so screen readers describe its
 * current effect.
 */
export default function PasswordField({ label, error, id, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? `pw-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block label-eyebrow text-cream-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={rest.autoComplete ?? "current-password"}
          className={`w-full rounded-xl bg-ink-900 border px-4 py-3 pr-12 text-base font-serif
                      focus:outline-none placeholder:text-cream-500 transition-colors
                      ${
                        error
                          ? "border-red-500 focus:border-red-500"
                          : "border-ink-700 focus:border-amber"
                      }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 min-w-tap min-h-tap
                     flex items-center justify-center text-cream-400 hover:text-cream-100"
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="text-sm text-red-400 font-serif">{error}</p>}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a17.66 17.66 0 0 1-3.12 4.19" />
      <path d="M6.61 6.61A17.66 17.66 0 0 0 2 12s3.5 7 10 7a10.94 10.94 0 0 0 5.39-1.41" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

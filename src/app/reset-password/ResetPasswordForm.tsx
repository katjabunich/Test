"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/settings/password-actions";
import { useT } from "@/lib/i18n/client";

/** Full-page "set a new password" form shown after the recovery email
    callback. Reuses the existing updatePassword server action so the
    same length / match validation runs on both surfaces. After success,
    the user is already signed in (the recovery code minted a session),
    so we redirect straight to Today. */
export default function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  function submit() {
    setError(null);
    if (password.length < 8) {
      setError(t("login.err_pw_short"));
      return;
    }
    if (password !== confirm) {
      setError(t("login.err_pw_match"));
      return;
    }
    const fd = new FormData();
    fd.set("password", password);
    fd.set("confirm", confirm);
    startTransition(async () => {
      const result = await updatePassword(fd);
      if (result.code) {
        setError(t(`login.err_${result.code}`));
        return;
      }
      if (result.raw) {
        setError(result.raw);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/"), 600);
    });
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
        padding:
          "max(36px, calc(env(safe-area-inset-top) + 24px)) 22px max(28px, calc(env(safe-area-inset-bottom) + 22px))",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 380,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-emphasis)",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "var(--ink)",
            margin: "0 0 12px",
          }}
        >
          {t("login.reset_pw_title")}
        </h1>
        <p
          style={{
            fontSize: 15.5,
            color: "var(--ink-80)",
            lineHeight: 1.45,
            letterSpacing: "-0.005em",
            margin: "0 0 28px",
          }}
        >
          {t("login.reset_pw_sub")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending) submit();
          }}
        >
          <Field
            label={t("pw.new_label")}
            value={password}
            onChange={setPassword}
            inputRef={inputRef}
            disabled={pending || done}
            hint={t("login.pw_hint")}
            autoComplete="new-password"
          />
          <Field
            label={t("pw.confirm_label")}
            value={confirm}
            onChange={setConfirm}
            disabled={pending || done}
            autoComplete="new-password"
          />

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 4,
                marginBottom: 14,
                padding: "11px 13px",
                borderRadius: 12,
                background: "rgba(217,106,82,0.10)",
                color: "var(--alert, #c25a44)",
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.45,
                letterSpacing: "-0.003em",
              }}
            >
              {error}
            </div>
          )}

          {done && (
            <div
              role="status"
              style={{
                marginTop: 4,
                marginBottom: 14,
                padding: "11px 13px",
                borderRadius: 12,
                background: "rgba(79,156,106,0.14)",
                color: "var(--mint-deep)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.003em",
              }}
            >
              {t("pw.success")}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || done || !password || !confirm}
            className="tap"
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              background:
                pending || done || !password || !confirm
                  ? "var(--ink-20)"
                  : "var(--ink-strong)",
              color: "var(--paper)",
              border: "none",
              cursor: pending || done ? "default" : "pointer",
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              boxShadow:
                pending || done || !password || !confirm
                  ? "none"
                  : "0 6px 16px rgba(31,24,19,0.28)",
              marginTop: 8,
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? t("common.waiting") : t("login.reset_pw_save")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputRef,
  disabled,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
          marginBottom: 6,
          paddingLeft: 4,
        }}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        type="password"
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "13px 14px",
          borderRadius: 12,
          border: "1px solid var(--ink-10)",
          background: "var(--paper-warm)",
          fontSize: 15,
          color: "var(--ink)",
          fontFamily: "var(--font-sans), -apple-system, system-ui, sans-serif",
          letterSpacing: "-0.005em",
          outline: "none",
        }}
      />
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: 11.5,
            color: "var(--ink-40)",
            paddingLeft: 4,
            marginTop: 4,
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

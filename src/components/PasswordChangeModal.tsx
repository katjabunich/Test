"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updatePassword } from "@/app/settings/password-actions";
import { feedbackModalOpen } from "@/lib/feedback";
import { useT } from "@/lib/i18n/client";

type Props = { open: boolean; onClose: () => void };

export default function PasswordChangeModal({ open, onClose }: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    feedbackModalOpen();
    setPassword("");
    setConfirm("");
    setError(null);
    setDone(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;

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
      setTimeout(onClose, 1100);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(45,38,32,0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--paper)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "10px 22px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(45,38,32,0.18)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.cancel")}
          className="tap"
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "6px 0 14px",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "block",
              width: 40,
              height: 4.5,
              background: "var(--ink-20)",
              borderRadius: 3,
              margin: "0 auto",
            }}
          />
        </button>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginBottom: 14,
            letterSpacing: "-0.005em",
          }}
        >
          {t("pw.title")}
        </div>

        <Field
          inputRef={inputRef}
          label={t("pw.new_label")}
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t("pw.pw_hint")}
          disabled={pending || done}
        />
        <Field
          label={t("pw.confirm_label")}
          name="confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={pending || done}
          onSubmit={submit}
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
              lineHeight: 1.45,
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
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {t("pw.success")}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="tap"
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 14,
              background: "var(--paper-warm)",
              color: "var(--ink-80)",
              border: "1px solid var(--ink-10)",
              cursor: "pointer",
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || done}
            className="tap"
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 14,
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "none",
              cursor: pending ? "default" : "pointer",
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              boxShadow: "0 5px 14px rgba(31,24,19,0.24)",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? t("common.waiting") : done ? t("common.done") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  inputRef,
  label,
  name,
  value,
  onChange,
  autoComplete,
  hint,
  disabled,
  onSubmit,
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: string;
  disabled?: boolean;
  onSubmit?: () => void;
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
        name={name}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
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

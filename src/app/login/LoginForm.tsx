"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { signInWithPassword, signUpWithPassword } from "./actions";

type Mode = "signin" | "signup";

export default function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("next", next);
    if (typeof window !== "undefined") {
      formData.set("origin", window.location.origin);
    }
    startTransition(async () => {
      const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
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
        position: "relative",
      }}
    >
      {/* Decorative sphere chips floating at the top, hint of the app palette. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "max(20px, calc(env(safe-area-inset-top) + 8px))",
          left: 22,
          display: "flex",
          gap: 6,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--peach)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--mint)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--lilac)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--butter)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--pool)" }} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 380,
          width: "100%",
          margin: "0 auto",
          paddingTop: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-emphasis)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-60)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          DoIt
        </div>

        <h1
          style={{
            fontFamily: "var(--font-emphasis)",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "var(--ink)",
            margin: "0 0 12px",
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {mode === "signin" ? "С возвращением" : "Заведи аккаунт"}
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
          {mode === "signin" ? (
            <>
              Задачи и привычки на <span className="mark-butter">всех твоих устройствах</span>.
            </>
          ) : (
            <>
              Сферы, задачи, привычки — <span className="mark-butter">синхронизация</span> в облаке.
            </>
          )}
        </p>

        {/* Pill segmented mode toggle */}
        <div
          role="tablist"
          aria-label="Режим входа"
          style={{
            display: "flex",
            background: "var(--paper-deep)",
            borderRadius: 999,
            padding: 4,
            marginBottom: 22,
            gap: 4,
          }}
        >
          <ModeTab
            active={mode === "signin"}
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            label="Войти"
          />
          <ModeTab
            active={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            label="Регистрация"
          />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={pending}
          className="tap"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            background: "var(--paper-warm)",
            color: "var(--ink)",
            border: "1px solid var(--ink-10)",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 16,
            boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
          }}
        >
          <GoogleGlyph />
          {mode === "signin" ? "Войти через Google" : "Зарегистрироваться через Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 18px" }}>
          <span style={{ flex: 1, height: 1, background: "var(--ink-10)" }} />
          <span
            style={{
              fontFamily: "var(--font-emphasis)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--ink-40)",
              letterSpacing: "0.02em",
            }}
          >
            или
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--ink-10)" }} />
        </div>

        <form action={handleSubmit}>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
          <Field
            label="Пароль"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            disabled={pending}
            hint={mode === "signup" ? "От 8 символов" : undefined}
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
                letterSpacing: "-0.003em",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="tap"
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "none",
              cursor: pending ? "default" : "pointer",
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              boxShadow: "0 6px 16px rgba(31,24,19,0.28)",
              marginTop: 8,
              opacity: pending ? 0.7 : 1,
              fontFamily: "var(--font-sans), -apple-system, system-ui, sans-serif",
            }}
          >
            {pending
              ? "Минутку…"
              : mode === "signin"
                ? "Войти"
                : "Зарегистрироваться"}
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--ink-40)",
          letterSpacing: "-0.003em",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        v2 · вход и облачная синхронизация
      </p>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="tap"
      style={{
        flex: 1,
        padding: "10px 0",
        borderRadius: 999,
        background: active ? "var(--paper)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-60)",
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        boxShadow: active ? "0 2px 6px rgba(45,38,32,0.10)" : "none",
        transition: "background 200ms var(--ease-out), color 200ms var(--ease-out)",
      }}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
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
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .95 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

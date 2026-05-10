"use client";

import { useState, useTransition } from "react";
import { signInWithPassword, signUpWithPassword, requestPasswordReset } from "./actions";
import { useT, useLang } from "@/lib/i18n/client";

type Mode = "signin" | "signup" | "reset";
type Banner = { kind: "error" | "info"; text: string; raw?: string };

export default function LoginForm({ next }: { next: string }) {
  const t = useT();
  const lang = useLang();
  const [mode, setMode] = useState<Mode>("signin");
  const [banner, setBanner] = useState<Banner | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setBanner(null);
    formData.set("next", next);
    formData.set("lang", lang);
    if (typeof window !== "undefined") {
      formData.set("origin", window.location.origin);
    }
    if (mode === "reset") {
      const email = String(formData.get("email") ?? "").trim();
      startTransition(async () => {
        const result = await requestPasswordReset(formData);
        if (result.ok) {
          setBanner({
            kind: "info",
            text:
              t("login.reset_sent_pre") +
              email +
              t("login.reset_sent_post"),
          });
        } else {
          setBanner({
            kind: "error",
            text: t("common.err_unknown"),
            raw: result.raw,
          });
        }
      });
      return;
    }
    startTransition(async () => {
      const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
      const result = await action(formData);
      if (result?.code === "confirm_email") {
        setBanner({ kind: "info", text: t("login.err_confirm_email"), raw: result.raw });
      } else if (result?.code) {
        setBanner({ kind: "error", text: t(`login.err_${result.code}`), raw: result.raw });
      } else if (result?.raw) {
        setBanner({ kind: "error", text: result.raw });
      }
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
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {mode === "signin"
            ? t("login.signin_title")
            : mode === "signup"
            ? t("login.signup_title")
            : t("login.reset_title")}
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
              {t("login.signin_sub_pre")}
              <span className="mark-butter">{t("login.signin_sub_mark")}</span>
              {t("login.signin_sub_post")}
            </>
          ) : mode === "signup" ? (
            <>
              {t("login.signup_sub_pre")}
              <span className="mark-butter">{t("login.signup_sub_mark")}</span>
              {t("login.signup_sub_post")}
            </>
          ) : (
            t("login.reset_sub")
          )}
        </p>

        {mode !== "reset" && (
          <div
            role="tablist"
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
                setBanner(null);
              }}
              label={t("login.tab_signin")}
            />
            <ModeTab
              active={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setBanner(null);
              }}
              label={t("login.tab_signup")}
            />
          </div>
        )}

        <form action={handleSubmit}>
          <Field
            label={t("login.email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
          {mode !== "reset" && (
            <Field
              label={t("login.password")}
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              disabled={pending}
              hint={mode === "signup" ? t("login.pw_hint") : undefined}
            />
          )}
          {mode === "signin" && (
            <div style={{ marginTop: -6, marginBottom: 14, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setBanner(null);
                }}
                className="tap"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px 4px",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--ink-60)",
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textUnderlineOffset: 4,
                }}
              >
                {t("login.forgot")}
              </button>
            </div>
          )}
          {mode === "signup" && (
            <Field
              label={t("login.invite")}
              name="invite"
              type="text"
              autoComplete="off"
              required
              disabled={pending}
              hint={t("login.invite_hint")}
            />
          )}

          {banner && (
            <div
              role={banner.kind === "error" ? "alert" : "status"}
              style={{
                marginTop: 4,
                marginBottom: 14,
                padding: "11px 13px",
                borderRadius: 12,
                background:
                  banner.kind === "error"
                    ? "rgba(217,106,82,0.10)"
                    : "rgba(79,156,106,0.14)",
                color:
                  banner.kind === "error"
                    ? "var(--alert, #c25a44)"
                    : "var(--mint-deep)",
                fontSize: 13,
                fontWeight: banner.kind === "info" ? 500 : 400,
                lineHeight: 1.45,
                letterSpacing: "-0.003em",
              }}
            >
              {banner.text}
              {banner.raw && banner.raw !== banner.text && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    opacity: 0.65,
                    fontWeight: 400,
                    wordBreak: "break-word",
                  }}
                >
                  {banner.raw}
                </div>
              )}
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
              ? t("common.waiting")
              : mode === "signin"
                ? t("login.cta_signin")
                : mode === "signup"
                  ? t("login.cta_signup")
                  : t("login.reset_send")}
          </button>
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setBanner(null);
              }}
              className="tap"
              style={{
                marginTop: 14,
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "8px 0",
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--ink-60)",
                letterSpacing: "-0.005em",
                cursor: "pointer",
              }}
            >
              {t("login.reset_back")}
            </button>
          )}
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
        {t("login.footer")}
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


"use client";

import { useEffect, useState } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import { Icons, SphereIcon } from "@/components/Icons";
import { isSoundEnabled, isHapticEnabled, setSoundEnabled, setHapticEnabled } from "@/lib/feedback";
import { useT, useLang, useSetLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";

export default function SettingsView({
  spheres,
  userEmail,
}: {
  spheres: Sphere[];
  userEmail: string | null;
}) {
  const t = useT();
  const lang = useLang();
  const { setLang } = useSetLang();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);

  useEffect(() => {
    setSound(isSoundEnabled());
    setHaptic(isHapticEnabled());
  }, []);

  return (
    <>
      <div style={{ padding: "8px 22px 18px" }}>
        <h1
          style={{
            fontFamily: "var(--font-emphasis)",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {t("settings.title")}
        </h1>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginTop: 8,
            letterSpacing: "-0.005em",
          }}
        >
          {t("settings.sub")}
        </div>
      </div>

      <div style={{ padding: "0 18px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-80)",
            padding: "0 4px 8px",
            borderBottom: "1px solid var(--ink-10)",
            marginBottom: 10,
            letterSpacing: "-0.005em",
          }}
        >
          {t("settings.h_spheres")}
        </div>

        <div
          style={{
            background: "var(--paper-warm)",
            borderRadius: 18,
            border: "1px solid var(--ink-05)",
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          {spheres.length === 0 ? (
            <div
              style={{
                padding: "28px 14px 32px",
                textAlign: "center",
                color: "var(--ink-60)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <SpheresEmpty />
              {t("settings.no_spheres")}
            </div>
          ) : (
            spheres.map((s, i) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setEditing(s);
                  setModalOpen(true);
                }}
                className="tap"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom:
                    i === spheres.length - 1
                      ? "none"
                      : "1px solid var(--ink-05)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <SphereIcon
                    name={s.name}
                    size={18}
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.name}
                  </span>
                </span>
                <Icons.Chevron size={16} stroke="var(--ink-40)" />
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="tap"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 14,
            border: "1.5px dashed var(--ink-20)",
            background: "transparent",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-60)",
            cursor: "pointer",
            marginBottom: 24,
            letterSpacing: "-0.005em",
          }}
        >
          {t("settings.add_sphere")}
        </button>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-80)",
            padding: "0 4px 8px",
            borderBottom: "1px solid var(--ink-10)",
            marginBottom: 10,
            letterSpacing: "-0.005em",
          }}
        >
          {t("settings.h_account")}
        </div>

        <div
          style={{
            background: "var(--paper-warm)",
            borderRadius: 18,
            border: "1px solid var(--ink-05)",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px",
              borderBottom: "1px solid var(--ink-05)",
            }}
          >
            <Icons.User size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail ?? "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPwOpen(true)}
            className="tap"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--ink-05)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icons.Lock size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
              }}
            >
              {t("settings.change_pw")}
            </span>
            <Icons.Chevron size={15} stroke="var(--ink-40)" />
          </button>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="tap"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icons.LogOut size={18} stroke="var(--alert)" strokeWidth={1.8} />
              <span
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: "var(--alert)",
                  letterSpacing: "-0.005em",
                }}
              >
                {t("settings.sign_out")}
              </span>
            </button>
          </form>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-80)",
            padding: "0 4px 8px",
            borderBottom: "1px solid var(--ink-10)",
            marginBottom: 10,
            letterSpacing: "-0.005em",
          }}
        >
          {t("settings.h_app")}
        </div>

        <div
          style={{
            background: "var(--paper-warm)",
            borderRadius: 18,
            border: "1px solid var(--ink-05)",
            overflow: "hidden",
          }}
        >
          <SettingsRow
            Icon={Icons.Phone}
            label={t("settings.install")}
            value={t("settings.install_val")}
            accent
          />
          <SettingsToggleRow
            Icon={Icons.Volume}
            label={t("settings.sound")}
            checked={sound}
            onChange={(v) => {
              setSound(v);
              setSoundEnabled(v);
            }}
          />
          <SettingsToggleRow
            Icon={Icons.Vibrate}
            label={t("settings.haptic")}
            checked={haptic}
            onChange={(v) => {
              setHaptic(v);
              setHapticEnabled(v);
            }}
          />
          <LanguageRow lang={lang} onChange={setLang} />
          <SettingsRow
            Icon={Icons.Cloud}
            label={t("settings.cloud")}
            value={t("settings.cloud_val")}
            accent
          />
          <SettingsRow
            Icon={Icons.Bell}
            label={t("settings.notify")}
            value="—"
            disabled
            last
          />
        </div>

        <p
          style={{
            marginTop: 22,
            padding: "0 6px",
            fontSize: 12,
            color: "var(--ink-40)",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}
        >
          {t("settings.footer")}
        </p>
      </div>

      <SphereEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={editing}
      />
      <PasswordChangeModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </>
  );
}

function SettingsRow({
  Icon,
  label,
  value,
  accent,
  disabled,
  last,
}: {
  Icon: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
  label: string;
  value: string;
  accent?: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const accentColor = accent ? "var(--mint-deep)" : "var(--ink-60)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        borderBottom: last ? "none" : "1px solid var(--ink-05)",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon size={18} stroke={accentColor} strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: accent ? 600 : 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: accentColor,
          letterSpacing: "-0.005em",
        }}
      >
        {value}
      </span>
      <Icons.Chevron size={15} stroke="var(--ink-40)" />
    </div>
  );
}

function SettingsToggleRow({
  Icon,
  label,
  checked,
  onChange,
}: {
  Icon: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        borderBottom: "1px solid var(--ink-05)",
        background: "transparent",
        border: "none",
        width: "100%",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Icon size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        style={{
          width: 38,
          height: 22,
          borderRadius: 12,
          background: checked ? "var(--mint-deep)" : "var(--ink-20)",
          position: "relative",
          transition: "background 200ms var(--ease-out)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--paper)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
            transition: "left 200ms var(--ease-out)",
          }}
        />
      </span>
    </button>
  );
}

function LanguageRow({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid var(--ink-05)",
      }}
    >
      <Icons.Globe size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {t("settings.language")}
      </span>
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          background: "var(--paper-deep)",
          borderRadius: 12,
          padding: 3,
          gap: 2,
        }}
      >
        {(["ru", "en"] as const).map((l) => {
          const active = lang === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange(l)}
              className="tap"
              aria-pressed={active}
              style={{
                border: "none",
                background: active ? "var(--paper)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-60)",
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 10px",
                borderRadius: 9,
                cursor: "pointer",
                letterSpacing: "0.04em",
                boxShadow: active ? "0 1px 2px rgba(45,38,32,0.12)" : "none",
              }}
            >
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpheresEmpty() {
  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      style={{ display: "block", margin: "0 auto 14px" }}
      aria-hidden
    >
      <circle cx="22" cy="24" r="6" fill="var(--peach)" opacity="0.85" />
      <circle cx="46" cy="22" r="6" fill="var(--mint)" opacity="0.85" />
      <circle cx="34" cy="46" r="6" fill="var(--lilac)" opacity="0.85" />
      <path
        d="M 22 24 L 46 22 L 34 46 Z"
        fill="none"
        stroke="var(--ink-20)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

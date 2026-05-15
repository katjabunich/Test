"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";
import { feedbackModalOpen } from "@/lib/feedback";

/* Preset half-hour times spanning early morning to noon — covers
   essentially every morning-digest use case for a personal app. */
const PRESETS = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00",
];

type Props = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  /** Optional sheet title; defaults to "Когда?" */
  title?: string;
};

/** Bottom-sheet time picker — paper-warm chips for the few times users
    actually pick. Replaces the native `<input type="time">` whose look
    drifts heavily across Safari, Chrome, and Firefox. */
export default function TimePicker({
  open,
  value,
  onChange,
  onClose,
  title,
}: Props) {
  const t = useT();

  useEffect(() => {
    if (open) feedbackModalOpen();
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(45,38,32,0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 110,
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
            marginBottom: 16,
            letterSpacing: "-0.005em",
          }}
        >
          {title ?? t("time.title")}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {PRESETS.map((preset) => {
            const active = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onChange(preset);
                  onClose();
                }}
                className="tap tnum"
                style={{
                  padding: "12px 0",
                  borderRadius: 12,
                  border: active
                    ? "1.5px solid var(--ink)"
                    : "1px solid var(--ink-05)",
                  background: active ? "var(--ink)" : "var(--paper-warm)",
                  color: active ? "var(--paper)" : "var(--ink)",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                }}
              >
                {preset}
              </button>
            );
          })}
        </div>

        {value && !PRESETS.includes(value) && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 14,
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--ink-60)",
              background: "var(--paper-warm)",
              borderRadius: 12,
              letterSpacing: "-0.005em",
            }}
          >
            {t("time.current_custom", { v: value })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="tap"
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 14,
            border: "1px solid var(--ink-10)",
            background: "transparent",
            color: "var(--ink-80)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useT, useLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";
import { addDays, fromIsoDate, today as todayIso, toIsoDate } from "@/lib/date";
import { Icons } from "@/components/Icons";
import { feedbackModalOpen } from "@/lib/feedback";

type Props = {
  open: boolean;
  /** Selected ISO date (YYYY-MM-DD) or null. */
  value: string | null;
  onChange: (v: string | null) => void;
  onClose: () => void;
  /** Optional sheet header; defaults to t("datepick.title"). */
  title?: string;
};

const MONDAY_FIRST_WEEKDAY_LABELS_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const MONDAY_FIRST_WEEKDAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localeFor(lang: Lang): string {
  return lang === "ru" ? "ru-RU" : "en-GB";
}

/** Monday on/before, Sunday on/after — used to render a 7-column grid that
    always starts on a full week and never has empty slots at the corners. */
function buildMonthGrid(view: Date): Date[] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const startDow = first.getDay();
  const leading = startDow === 0 ? 6 : startDow - 1;
  const endDow = last.getDay();
  const trailing = endDow === 0 ? 0 : 7 - endDow;

  const days: Date[] = [];
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - leading);
  for (let i = 0; i < leading + (last.getDate()) + trailing; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Bottom-sheet date picker — paper-warm presets + a full-month grid with
    arrow navigation. Replaces the native `<input type="date">` so the
    paper aesthetic stays consistent across Safari, Chrome, and Firefox. */
export default function DatePicker({
  open,
  value,
  onChange,
  onClose,
  title,
}: Props) {
  const t = useT();
  const lang = useLang();

  const todayDate = useMemo(() => fromIsoDate(todayIso()), []);
  /* When the user opens the picker, jump the view to either the selected
     date or today. Stored in state so arrows can navigate freely. */
  const [view, setView] = useState<Date>(() => {
    const anchor = value ? fromIsoDate(value) : todayDate;
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    feedbackModalOpen();
    const anchor = value ? fromIsoDate(value) : todayDate;
    setView(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  }, [open, value, todayDate]);

  const grid = useMemo(() => buildMonthGrid(view), [view]);

  const monthLabel = useMemo(() => {
    const out = new Intl.DateTimeFormat(localeFor(lang), {
      month: "long",
      year: "numeric",
    }).format(view);
    return out.charAt(0).toUpperCase() + out.slice(1);
  }, [view, lang]);

  if (!open) return null;

  const valueIso = value;
  const todayIsoStr = toIsoDate(todayDate);

  const presets: { label: string; iso: string | null; active: boolean }[] = [
    {
      label: t("datepick.today"),
      iso: todayIsoStr,
      active: valueIso === todayIsoStr,
    },
    {
      label: t("datepick.tomorrow"),
      iso: addDays(todayIsoStr, 1),
      active: valueIso === addDays(todayIsoStr, 1),
    },
    {
      label: t("datepick.none"),
      iso: null,
      active: valueIso === null,
    },
  ];

  function pick(iso: string | null) {
    onChange(iso);
    onClose();
  }

  function shiftMonth(delta: number) {
    setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const weekdayLabels =
    lang === "ru" ? MONDAY_FIRST_WEEKDAY_LABELS_RU : MONDAY_FIRST_WEEKDAY_LABELS_EN;

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
          {title ?? t("datepick.title")}
        </div>

        {/* Preset chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 18,
          }}
        >
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => pick(p.iso)}
              className="tap"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: p.active
                  ? "1.5px solid var(--ink)"
                  : "1px solid var(--ink-05)",
                background: p.active ? "var(--ink)" : "var(--paper-warm)",
                color: p.active ? "var(--paper)" : "var(--ink)",
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Month header with prev/next arrows */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t("datepick.prev")}
            className="tap"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-60)",
              padding: 0,
            }}
          >
            <span style={{ display: "inline-block", transform: "rotate(180deg)" }}>
              <Icons.Chevron size={18} stroke="currentColor" strokeWidth={2} />
            </span>
          </button>
          <div
            style={{
              fontFamily: "var(--font-emphasis)",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {monthLabel}
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t("datepick.next")}
            className="tap"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-60)",
              padding: 0,
            }}
          >
            <Icons.Chevron size={18} stroke="currentColor" strokeWidth={2} />
          </button>
        </div>

        {/* Weekday header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 4,
          }}
        >
          {weekdayLabels.map((w) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--ink-40)",
                padding: "4px 0",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 16,
          }}
        >
          {grid.map((d) => {
            const iso = toIsoDate(d);
            const inMonth = d.getMonth() === view.getMonth();
            const isToday = iso === todayIsoStr;
            const isSelected = iso === valueIso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pick(iso)}
                className="tap tnum"
                style={{
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  border: "none",
                  background: isSelected
                    ? "var(--ink)"
                    : isToday
                    ? "rgba(79,156,106,0.12)"
                    : "transparent",
                  color: isSelected
                    ? "var(--paper)"
                    : !inMonth
                    ? "var(--ink-40)"
                    : isToday
                    ? "var(--mint-deep)"
                    : "var(--ink)",
                  fontSize: 14,
                  fontWeight: isSelected || isToday ? 600 : 500,
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                  position: "relative",
                  opacity: !inMonth && !isSelected ? 0.55 : 1,
                }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              const t = new Date();
              setView(new Date(t.getFullYear(), t.getMonth(), 1));
            }}
            className="tap"
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 14,
              border: "1px solid var(--ink-10)",
              background: "transparent",
              color: "var(--ink-80)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "-0.005em",
            }}
          >
            {t("datepick.jump_today")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="tap"
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 14,
              border: "1px solid var(--ink-10)",
              background: "transparent",
              color: "var(--ink-80)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "-0.005em",
            }}
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Habit, HabitScheduleType } from "@/lib/data";
import { createHabit, deleteHabit, updateHabit } from "@/lib/actions";
import { HABIT_PRESET_ICONS, HabitIcon, Icons, parseHabitIcon } from "@/components/Icons";
import { feedbackModalOpen } from "@/lib/feedback";
import { useT, useLang } from "@/lib/i18n/client";
import { PillButton, SectionLabel } from "@/components/ui";

const COLORS = [
  "#86c79a", "#f4936e", "#f5c563", "#6ba4c2",
  "#b5a3df", "#e89bb0", "#0ABAB5", "#4f9c6a",
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_INDEX = [1, 2, 3, 4, 5, 6, 0];

type Props = {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
};

export default function HabitEditModal({ open, onClose, habit }: Props) {
  const t = useT();
  const lang = useLang();
  const isEdit = !!habit;
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  // Stored value: ":<IconKey>" for built-in line-art icon, or a raw emoji.
  const [iconValue, setIconValue] = useState<string>(`:${HABIT_PRESET_ICONS[0]}`);
  const [color, setColor] = useState(COLORS[0]);
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    feedbackModalOpen();
    if (habit) {
      setName(habit.name);
      setIconValue(habit.emoji ?? `:${HABIT_PRESET_ICONS[0]}`);
      setColor(habit.color || COLORS[0]);
      setScheduleType(habit.schedule_type);
      const v = habit.schedule_value as { days?: number[] } | null;
      setDays(v?.days ?? [1, 2, 3, 4, 5]);
    } else {
      setName("");
      setIconValue(`:${HABIT_PRESET_ICONS[0]}`);
      setColor(COLORS[0]);
      setScheduleType("daily");
      setDays([1, 2, 3, 4, 5]);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, habit]);

  if (!open) return null;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const payload = {
          name: trimmed,
          emoji: iconValue || null,
          color,
          schedule_type: scheduleType,
          schedule_value:
            scheduleType === "weekdays" ? { days } : null,
        };
        if (isEdit && habit) await updateHabit(habit.id, payload);
        else await createHabit(payload);
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function remove() {
    if (!habit) return;
    if (!confirm(t("habit.delete_confirm"))) return;
    startTransition(async () => {
      try {
        await deleteHabit(habit.id);
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function toggleDay(i: number) {
    setDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort(),
    );
  }

  // Show whatever is currently selected in the preview tile
  const previewParsed = parseHabitIcon(iconValue);
  const customEmojiValue =
    previewParsed.kind === "emoji" ? previewParsed.emoji : "";

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
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          padding: "10px 22px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-modal)",
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
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--ink-strong)",
            marginBottom: 16,
          }}
        >
          {isEdit ? t("habit.title_edit") : t("habit.title_new")}
        </div>

        {/* Icon preview + name */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-sm)",
              background: color,
              border: `1px solid ${color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "var(--ink)",
            }}
          >
            <HabitIcon
              value={iconValue}
              size={26}
              stroke="currentColor"
              strokeWidth={2}
            />
          </div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("habit.name_ph")}
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              border: "1px solid var(--ink-10)",
              borderRadius: "var(--radius-sm)",
              background: "var(--paper-warm)",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        {/* Icon picker */}
        <SectionLabel style={{ marginBottom: 10 }}>
          {t("habit.icon_label")}
        </SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {HABIT_PRESET_ICONS.map((key) => {
            const active = iconValue === `:${key}`;
            const Comp = Icons[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIconValue(`:${key}`)}
                aria-label={key}
                className="tap"
                style={{
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--ink-10)"}`,
                  background: active ? "var(--ink)" : "var(--paper-warm)",
                  color: active ? "var(--paper)" : "var(--ink-80)",
                  cursor: "pointer",
                }}
              >
                <Comp size={18} stroke="currentColor" strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-60)",
              flexShrink: 0,
              letterSpacing: "-0.005em",
            }}
          >
            {t("habit.or_emoji")}
          </span>
          <input
            value={customEmojiValue}
            onChange={(e) => {
              const v = e.target.value.slice(0, 4);
              if (v) setIconValue(v);
            }}
            placeholder="✨"
            style={{
              width: 70,
              padding: "8px 0",
              fontSize: 18,
              border: "1px solid var(--ink-10)",
              borderRadius: "var(--radius-sm)",
              background: "var(--paper-warm)",
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        {/* Color */}
        <SectionLabel style={{ marginBottom: 10 }}>
          {t("habit.color_label")}
        </SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className="tap"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: c,
                border:
                  color === c
                    ? "2.5px solid var(--ink)"
                    : "2px solid var(--paper)",
                outline: color === c ? "2px solid var(--paper)" : "none",
                outlineOffset: -4,
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Schedule */}
        <SectionLabel style={{ marginBottom: 10 }}>
          {t("habit.schedule_label")}
        </SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <ScheduleChip
            active={scheduleType === "daily"}
            label={t("habits.sched_daily")}
            onClick={() => setScheduleType("daily")}
          />
          <ScheduleChip
            active={scheduleType === "weekdays"}
            label={t("habits.sched_weekdays")}
            onClick={() => setScheduleType("weekdays")}
          />
          <ScheduleChip
            active={scheduleType === "n_per_week"}
            label={t("habits.sched_n_per_week", { n: 3 })}
            onClick={() => setScheduleType("n_per_week")}
          />
        </div>
        {scheduleType === "weekdays" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {WEEKDAY_INDEX.map((idx, j) => {
              const label = (lang === "en" ? WEEKDAYS_EN : WEEKDAYS_RU)[j];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className="tap"
                  style={{
                    width: 40,
                    height: 36,
                    borderRadius: 999,
                    border: days.includes(idx)
                      ? "1.5px solid var(--mint-deep)"
                      : "1px solid var(--ink-10)",
                    background: days.includes(idx)
                      ? "rgba(107,191,138,0.14)"
                      : "var(--paper-warm)",
                    color: days.includes(idx) ? "var(--mint-deep)" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "stretch" }}>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="tap"
              style={{
                padding: "13px 16px",
                borderRadius: 999,
                border: "1.5px solid var(--ink-10)",
                background: "transparent",
                color: "var(--alert)",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icons.Trash size={15} stroke="var(--alert)" strokeWidth={1.8} />
            </button>
          )}
          <PillButton
            variant="filled"
            color={name.trim() ? "var(--mint-deep)" : "var(--ink-20)"}
            onClick={submit}
            disabled={isPending || !name.trim()}
            style={{
              flex: 1,
              padding: "15px 0",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 800,
              boxShadow: name.trim()
                ? "0 6px 16px rgba(107,191,138,0.35)"
                : "none",
            }}
          >
            {t("common.done")}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

function ScheduleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: active
          ? "1.5px solid var(--mint-deep)"
          : "1px solid var(--ink-10)",
        background: active ? "rgba(107,191,138,0.14)" : "#FFFFFF",
        color: active ? "var(--mint-deep)" : "var(--ink)",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

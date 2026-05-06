"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Habit, HabitScheduleType } from "@/lib/data";
import { createHabit, deleteHabit, updateHabit } from "@/lib/actions";
import { HABIT_PRESET_ICONS, HabitIcon, Icons, parseHabitIcon } from "@/components/Icons";

const COLORS = [
  "#86c79a", "#f3a78b", "#f5c563", "#7d96a8",
  "#b5a3df", "#e89bb0", "#0ABAB5", "#4f9c6a",
];

const WEEKDAYS = [
  { i: 1, label: "Пн" },
  { i: 2, label: "Вт" },
  { i: 3, label: "Ср" },
  { i: 4, label: "Чт" },
  { i: 5, label: "Пт" },
  { i: 6, label: "Сб" },
  { i: 0, label: "Вс" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
};

export default function HabitEditModal({ open, onClose, habit }: Props) {
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
    if (!confirm("Удалить привычку и весь её лог?")) return;
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
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "10px 22px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(45,38,32,0.18)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4.5,
            background: "var(--ink-20)",
            borderRadius: 3,
            margin: "0 auto 16px",
          }}
        />
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            marginBottom: 14,
            letterSpacing: "0.13em",
          }}
        >
          {isEdit ? "ПРИВЫЧКА" : "НОВАЯ ПРИВЫЧКА"}
        </div>

        {/* Icon preview + name */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
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
            placeholder="Привычка"
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              border: "1px solid var(--ink-10)",
              borderRadius: 12,
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
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            marginBottom: 10,
            letterSpacing: "0.1em",
          }}
        >
          ИКОНКА
        </div>
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
                  borderRadius: 10,
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
            className="mono lower"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-60)",
              flexShrink: 0,
            }}
          >
            или эмодзи:
          </span>
          <input
            value={customEmojiValue}
            onChange={(e) => {
              const v = e.target.value.slice(0, 4);
              if (v) setIconValue(v);
            }}
            placeholder="🎹"
            style={{
              width: 70,
              padding: "8px 0",
              fontSize: 18,
              border: "1px solid var(--ink-10)",
              borderRadius: 10,
              background: "var(--paper-warm)",
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        {/* Color */}
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            marginBottom: 10,
            letterSpacing: "0.1em",
          }}
        >
          ЦВЕТ
        </div>
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
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            marginBottom: 10,
            letterSpacing: "0.1em",
          }}
        >
          РАСПИСАНИЕ
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <ScheduleChip
            active={scheduleType === "daily"}
            label="каждый день"
            onClick={() => setScheduleType("daily")}
          />
          <ScheduleChip
            active={scheduleType === "weekdays"}
            label="по дням"
            onClick={() => setScheduleType("weekdays")}
          />
          <ScheduleChip
            active={scheduleType === "n_per_week"}
            label="без расписания"
            onClick={() => setScheduleType("n_per_week")}
          />
        </div>
        {scheduleType === "weekdays" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {WEEKDAYS.map((d) => (
              <button
                key={d.i}
                type="button"
                onClick={() => toggleDay(d.i)}
                className="tap mono lower"
                style={{
                  width: 40,
                  height: 36,
                  borderRadius: 999,
                  border: days.includes(d.i)
                    ? "1.5px solid var(--mint-deep)"
                    : "1px solid var(--ink-10)",
                  background: days.includes(d.i)
                    ? "rgba(79,156,106,0.12)"
                    : "var(--paper-warm)",
                  color: days.includes(d.i) ? "var(--mint-deep)" : "var(--ink)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {d.label}
              </button>
            ))}
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
                padding: "13px 14px",
                borderRadius: 14,
                border: "1px solid var(--ink-10)",
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
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim()}
            className="tap"
            style={{
              flex: 1,
              padding: "15px 0",
              borderRadius: 14,
              background: name.trim()
                ? "var(--mint-deep)"
                : "rgba(79,156,106,0.4)",
              color: "#fff",
              border: "none",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: name.trim()
                ? "0 6px 16px rgba(79,156,106,0.4)"
                : "none",
            }}
          >
            Готово
          </button>
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
      className="tap mono lower"
      style={{
        padding: "7px 12px",
        borderRadius: 10,
        border: active
          ? "1.5px solid var(--mint-deep)"
          : "1px solid var(--ink-05)",
        background: active ? "rgba(79,156,106,0.12)" : "var(--paper-warm)",
        color: active ? "var(--mint-deep)" : "var(--ink)",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

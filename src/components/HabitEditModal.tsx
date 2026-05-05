"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Habit, HabitScheduleType } from "@/lib/data";
import { createHabit, updateHabit, deleteHabit } from "@/lib/actions";

const COLORS = [
  "#0ABAB5", // tiffany
  "#7DAEC4", // steel
  "#F5B5A8", // peach
  "#F4C77A", // honey
  "#E89B8E", // coral
  "#9CA8B0", // graphite
  "#B5DCC4", // mint
  "#D4B0E0", // lilac
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
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji ?? "");
      setColor(habit.color || COLORS[0]);
      setScheduleType(habit.schedule_type);
      const v = habit.schedule_value as { days?: number[] } | null;
      setDays(v?.days ?? [1, 2, 3, 4, 5]);
    } else {
      setName("");
      setEmoji("");
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
          emoji: emoji.trim() || null,
          color,
          schedule_type: scheduleType,
          schedule_value:
            scheduleType === "weekdays" ? { days } : null,
        };
        if (isEdit && habit) {
          await updateHabit(habit.id, payload);
        } else {
          await createHabit(payload);
        }
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
    setDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort()));
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 30, 0.25)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          maxWidth: 430,
          background: "var(--bg-base)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -8px 32px rgba(10, 40, 40, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 500 }}>
            {isEdit ? "Изменить" : "Новая привычка"}
          </span>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              width: 32, height: 32, borderRadius: 16, border: "none",
              background: "rgba(0,0,0,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
            placeholder="🎹"
            style={{
              width: 56,
              padding: "12px 0",
              fontSize: 22,
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              background: "white",
              outline: "none",
              textAlign: "center",
            }}
          />
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Привычка"
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 17,
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              background: "white",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        {/* Color */}
        <div style={{ marginTop: 16 }}>
          <Label>Цвет</Label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2.5px solid var(--text)" : "2px solid white",
                  cursor: "pointer",
                  outline: color === c ? "2px solid white" : "none",
                  outlineOffset: -4,
                }}
              />
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div style={{ marginTop: 16 }}>
          <Label>Расписание</Label>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <ScheduleChip
              active={scheduleType === "daily"}
              onClick={() => setScheduleType("daily")}
              label="каждый день"
            />
            <ScheduleChip
              active={scheduleType === "weekdays"}
              onClick={() => setScheduleType("weekdays")}
              label="по дням"
            />
            <ScheduleChip
              active={scheduleType === "n_per_week"}
              onClick={() => setScheduleType("n_per_week")}
              label="без расписания"
            />
          </div>
          {scheduleType === "weekdays" && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {WEEKDAYS.map((d) => (
                <button
                  key={d.i}
                  type="button"
                  onClick={() => toggleDay(d.i)}
                  style={{
                    width: 40,
                    height: 36,
                    borderRadius: 999,
                    border: days.includes(d.i) ? "1.5px solid var(--accent)" : "1px solid var(--hairline)",
                    background: days.includes(d.i) ? "var(--accent-tint)" : "white",
                    color: days.includes(d.i) ? "var(--accent-deep)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--hairline)",
                background: "transparent",
                color: "#C46E5A",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Удалить
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim()}
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: 12,
              border: "none",
              background: name.trim() ? "var(--accent)" : "var(--accent-soft)",
              color: "white",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", opacity: 0.7 }}>
      {children}
    </div>
  );
}

function ScheduleChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        border: active ? "1.5px solid var(--accent)" : "1px solid var(--hairline)",
        background: active ? "var(--accent-tint)" : "white",
        color: active ? "var(--accent-deep)" : "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { computeStreak, isScheduledOn, lastDays } from "@/lib/habits";

const ACCENT_FALLBACK = "var(--accent)";

export default function HabitCard({
  habit,
  logged,
  onEdit,
}: {
  habit: Habit;
  logged: Set<string>;
  onEdit: (habit: Habit) => void;
}) {
  const color = habit.color || ACCENT_FALLBACK;

  // Local optimistic copy of the logged set so taps feel instant.
  const [localLogged, setLocalLogged] = useState<Set<string>>(new Set(logged));
  const [, startTransition] = useTransition();

  const days = lastDays(7);
  const streak = computeStreak(habit, localLogged);

  function toggleDay(date: string) {
    const next = new Set(localLogged);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setLocalLogged(next);
    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, date);
      } catch {
        // revert
        setLocalLogged(logged);
      }
    });
  }

  return (
    <div
      className="glass"
      style={{ padding: 16 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: `${color}26`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {habit.emoji || "•"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {habit.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {streak > 0 ? `${streak} ${plur(streak, ["день", "дня", "дней"])} подряд` : "стрик 0"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(habit)}
          aria-label="Изменить"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Last 7 days dots */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
        {days.map((d) => {
          const scheduled = isScheduledOn(habit, d);
          const done = localLogged.has(d);
          const isToday = d === days[days.length - 1];
          const wd = ["В", "П", "В", "С", "Ч", "П", "С"][new Date(d).getDay()];
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              disabled={!scheduled && !done}
              aria-label={d}
              style={{
                flex: 1,
                aspectRatio: "1 / 1",
                maxWidth: 44,
                borderRadius: 10,
                border: isToday ? `1.5px solid ${color}` : "1px solid var(--hairline)",
                background: done ? color : scheduled ? "white" : "rgba(0,0,0,0.02)",
                cursor: scheduled || done ? "pointer" : "default",
                color: done ? "white" : "var(--text-muted)",
                fontSize: 11,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: scheduled || done ? 1 : 0.4,
                transition: "background 150ms ease",
              }}
            >
              {wd}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function plur(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

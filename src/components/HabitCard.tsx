"use client";

import { useMemo, useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { computeStreak, isScheduledOn, lastDays } from "@/lib/habits";

const ACCENT_FALLBACK = "#0ABAB5";

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

  const [localLogged, setLocalLogged] = useState<Set<string>>(new Set(logged));
  const [, startTransition] = useTransition();

  const streak = useMemo(() => computeStreak(habit, localLogged), [habit, localLogged]);
  const days21 = useMemo(() => lastDays(21), []);

  function toggleDay(date: string) {
    const next = new Set(localLogged);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setLocalLogged(next);
    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, date);
      } catch {
        setLocalLogged(logged);
      }
    });
  }

  return (
    <div
      className="glass"
      style={{
        padding: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent wash in background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          background: `radial-gradient(closest-side, ${color}1F, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(140deg, ${color}24, ${color}12)`,
            border: `1px solid ${color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {habit.emoji || "•"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 550,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.005em",
            }}
          >
            {habit.name}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: 2 }}>
            <span
              className="tnum"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: streak > 0 ? color : "var(--text-faint)",
                letterSpacing: "-0.015em",
              }}
            >
              {streak}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {streak > 0 ? plur(streak, ["день", "дня", "дней"]) + " подряд" : "стрик 0"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(habit)}
          aria-label="Изменить"
          className="tap"
          style={{
            background: "rgba(0,0,0,0.04)",
            border: "none",
            borderRadius: 999,
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="18" r="1.6" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* 21-day heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gap: 3 }}>
        {days21.map((d) => {
          const scheduled = isScheduledOn(habit, d);
          const done = localLogged.has(d);
          const isToday = d === days21[days21.length - 1];
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              disabled={!scheduled && !done}
              aria-label={d}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 6,
                border: isToday ? `1.5px solid ${color}` : "1px solid var(--hairline)",
                background: done
                  ? `linear-gradient(140deg, ${color}, ${color}D9)`
                  : scheduled
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(0,0,0,0.025)",
                cursor: scheduled || done ? "pointer" : "default",
                opacity: scheduled || done ? 1 : 0.55,
                padding: 0,
                transition: "background 200ms var(--ease-out)",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 10,
          color: "var(--text-faint)",
          letterSpacing: 0.05,
          textTransform: "uppercase",
        }}
      >
        <span>3 недели назад</span>
        <span>сегодня</span>
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

"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { today } from "@/lib/date";

const ACCENT_FALLBACK = "#0ABAB5";

export default function HabitRing({
  habit,
  doneToday,
  streak,
  size = 60,
}: {
  habit: Habit;
  doneToday: boolean;
  streak: number;
  size?: number;
}) {
  const [optimistic, setOptimistic] = useState(doneToday);
  const [isPending, startTransition] = useTransition();
  const color = habit.color || ACCENT_FALLBACK;

  function handleClick() {
    const wasDone = optimistic;
    setOptimistic(!wasDone);
    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, today());
      } catch {
        setOptimistic(wasDone);
      }
    });
  }

  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic}
      aria-label={`${habit.name}${optimistic ? " — выполнено" : ""}`}
      className="tap"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px 6px",
        flexShrink: 0,
        opacity: isPending ? 0.7 : 1,
        minWidth: 70,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`hr-${habit.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.78" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill={optimistic ? `url(#hr-${habit.id})` : "var(--surface-tint)"}
            stroke={optimistic ? color : "var(--hairline)"}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={optimistic ? 0 : c}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 360ms var(--ease-spring), fill 240ms var(--ease-out)" }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.42,
            color: optimistic ? "white" : "var(--text-muted)",
          }}
        >
          {optimistic ? (
            <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17L19 7.5"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span>{habit.emoji || "·"}</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <span
          style={{
            fontSize: 11.5,
            color: "var(--text)",
            fontWeight: 500,
            maxWidth: size + 24,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.005em",
          }}
        >
          {habit.name}
        </span>
        <span
          className="tnum"
          style={{
            fontSize: 10.5,
            color: streak > 0 ? color : "var(--text-faint)",
            fontWeight: 600,
            letterSpacing: 0.05,
          }}
        >
          {streak > 0 ? `${streak} дн` : "—"}
        </span>
      </div>
    </button>
  );
}

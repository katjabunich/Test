"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { today } from "@/lib/date";

const ACCENT_FALLBACK = "#0ABAB5";

/** Tap-target ring for a single habit on the Today screen. Big enough to
   be a primary visual element, animates fill on completion. */
export default function HabitRing({
  habit,
  doneToday,
  streak,
  size = 64,
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

  const stroke = 3;
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
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          animation: !optimistic ? "softPulse 2.6s ease-in-out infinite" : "none",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`grad-${habit.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.78" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="rgba(255,255,255,0.6)"
            stroke="var(--hairline)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill={optimistic ? `url(#grad-${habit.id})` : "transparent"}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={optimistic ? 0 : c}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 360ms var(--ease-spring), fill 280ms var(--ease-out)" }}
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
            transition: "transform 240ms var(--ease-spring)",
            transform: optimistic ? "scale(1)" : "scale(0.96)",
          }}
        >
          {optimistic ? (
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17L19 7.5"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : habit.emoji ? (
            <span>{habit.emoji}</span>
          ) : (
            <span style={{ fontSize: size * 0.36, color: "var(--text-muted)" }}>•</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <span
          style={{
            fontSize: 11.5,
            color: "var(--text)",
            fontWeight: 500,
            maxWidth: size + 22,
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

"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { today } from "@/lib/date";

const ACCENT_FALLBACK = "var(--accent)";

/** Small circular tap-target showing whether the habit is done today. */
export default function HabitRing({
  habit,
  doneToday,
  size = 56,
}: {
  habit: Habit;
  doneToday: boolean;
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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        flexShrink: 0,
        opacity: isPending ? 0.7 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill={optimistic ? color : "transparent"}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={optimistic ? 0 : c}
            style={{ transition: "stroke-dashoffset 250ms ease, fill 250ms ease" }}
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
          }}
        >
          {optimistic ? (
            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5L10 17L19 7.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : habit.emoji ? (
            <span>{habit.emoji}</span>
          ) : null}
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          maxWidth: size + 16,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 500,
        }}
      >
        {habit.name}
      </span>
    </button>
  );
}

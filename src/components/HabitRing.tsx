"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { today } from "@/lib/date";
import { HabitIcon } from "@/components/Icons";
import { fireConfetti, isStreakMilestone } from "@/lib/celebrate";
import { feedbackHabitComplete, feedbackStreakMilestone } from "@/lib/feedback";

/** Ring per v4: thin 2px stroke, no surrounding container. Centre disk
    fills with the habit colour when done; otherwise its built-in icon /
    custom emoji sits on paper. weekDone fills the progress arc. */
export default function HabitRing({
  habit,
  doneToday,
  weekDone,
  streak,
  size = 56,
}: {
  habit: Habit;
  doneToday: boolean;
  weekDone: number;
  streak: number;
  size?: number;
}) {
  const [optimistic, setOptimistic] = useState(doneToday);
  const [isPending, startTransition] = useTransition();
  const color = habit.color || "var(--mint)";
  /* Same muting rule as HabitCard: candy DB colours pulled toward warm
     ink so strokes/fills stay inside the adult "dawn" palette. */
  const mutedColor = `color-mix(in srgb, ${color} 80%, #3B2E26)`;

  function handleClick() {
    const wasDone = optimistic;
    // If we're about to mark done, predict the new streak. This is
    // approximate — the actual streak depends on yesterday's log too —
    // but it's good enough to fire a celebration the user expects.
    if (!wasDone) {
      const predicted = streak + 1;
      if (isStreakMilestone(predicted)) {
        void fireConfetti(habit.color || undefined);
        feedbackStreakMilestone();
      } else {
        feedbackHabitComplete();
      }
    }
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
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(7, weekDone) / 7);
  const iconSize = Math.round(size * 0.42);

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
        padding: 0,
        flexShrink: 0,
        opacity: isPending ? 0.7 : 1,
        width: 76,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--ink-10)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={mutedColor}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 380ms var(--ease-out)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: "50%",
            background: optimistic ? mutedColor : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 220ms var(--ease-out)",
            /* Muted fill trends dark — cream icon keeps contrast when done. */
            color: optimistic ? "#FBF3EA" : mutedColor,
          }}
        >
          <HabitIcon
            value={habit.emoji}
            size={iconSize}
            stroke="currentColor"
            strokeWidth={2}
          />
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--ink-60)",
          fontWeight: 600,
          width: "100%",
          textAlign: "center",
          lineHeight: 1.25,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
          letterSpacing: "-0.005em",
        }}
      >
        {habit.name}
      </span>
    </button>
  );
}

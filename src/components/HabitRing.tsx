"use client";

import { useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { today } from "@/lib/date";
import { Icons } from "@/components/Icons";

const HABIT_NAME_TO_ICON: Record<string, keyof typeof Icons> = {
  "Вода": "Drop",
  "Бег": "Run",
  "Чтение": "Book",
  "Медитация": "Lotus",
  "Голландский": "Globe",
  "Голл.": "Globe",
  "Пианино": "Smile",
};

function pickIcon(habit: Habit): keyof typeof Icons {
  if (HABIT_NAME_TO_ICON[habit.name]) return HABIT_NAME_TO_ICON[habit.name];
  return "Dot";
}

/** Ring per v4: thin 2px stroke, no surrounding container. Centre disk
    fills with the habit colour when done; otherwise the line-art icon
    sits on paper. weekDone fills the progress arc. */
export default function HabitRing({
  habit,
  doneToday,
  weekDone,
  size = 56,
}: {
  habit: Habit;
  doneToday: boolean;
  weekDone: number;
  size?: number;
}) {
  const [optimistic, setOptimistic] = useState(doneToday);
  const [isPending, startTransition] = useTransition();
  const color = habit.color || "var(--mint)";

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

  const stroke = 2;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(7, weekDone) / 7);
  const IconComp = Icons[pickIcon(habit)];

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
            stroke={color}
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
            background: optimistic ? color : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 220ms var(--ease-out)",
          }}
        >
          <IconComp
            size={Math.round(size * 0.4)}
            stroke={optimistic ? "var(--ink)" : color}
            strokeWidth={2}
          />
        </div>
      </div>
      <span
        className="mono lower"
        style={{
          fontSize: 10,
          color: "var(--ink-60)",
          fontWeight: 500,
          maxWidth: size + 18,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {habit.name}
      </span>
    </button>
  );
}

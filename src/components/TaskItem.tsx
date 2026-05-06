"use client";

import { useState, useTransition } from "react";
import type { Sphere, Task } from "@/lib/data";
import { completeTask } from "@/lib/actions";
import { isPast, isToday, fromIsoDate } from "@/lib/date";

function dueLabel(due: string | null): { text: string; tone: "muted" | "warn" } | null {
  if (!due) return null;
  if (isToday(due)) return { text: "сегодня", tone: "muted" };
  if (isPast(due)) {
    const d = fromIsoDate(due);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    return { text: days === 1 ? "вчера" : `${days} дн назад`, tone: "warn" };
  }
  const d = fromIsoDate(due);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) {
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
    return { text: wd, tone: "muted" };
  }
  return { text: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`, tone: "muted" };
}

/** Task row per v4: paper-warm card, mint-bordered checkbox left, sphere
    chip + due label below the title. Animated check fills with sphere
    colour on tap. */
export default function TaskItem({
  task,
  sphere,
  onEdit,
}: {
  task: Task;
  sphere: Sphere | null;
  onEdit?: (task: Task) => void;
}) {
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const due = dueLabel(task.due_date);
  const overdue = !!(task.due_date && isPast(task.due_date));
  const sphereColor = sphere?.color ?? "var(--ink-40)";

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    setOptimisticDone(true);
    startTransition(async () => {
      try {
        await completeTask(task.id);
      } catch {
        setOptimisticDone(false);
      }
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit?.(task)}
      style={{
        background: overdue ? "rgba(217,106,82,0.06)" : "var(--paper-warm)",
        border: `1px solid ${overdue ? "rgba(217,106,82,0.18)" : "var(--ink-05)"}`,
        borderRadius: 16,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: onEdit ? "pointer" : "default",
        opacity: optimisticDone ? 0.4 : 1,
        transform: optimisticDone ? "translateX(6px)" : "translateX(0)",
        transition: "opacity 280ms var(--ease-out), transform 280ms var(--ease-out)",
      }}
    >
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || optimisticDone}
        aria-label="Отметить выполненной"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: `2px solid ${sphereColor}`,
          background: optimisticDone ? sphereColor : "transparent",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 200ms var(--ease-out)",
        }}
      >
        {optimisticDone && (
          <svg
            width="13"
            height="13"
            viewBox="0 0 12 12"
            fill="none"
            className="check-pop"
          >
            <path
              d="M2 6.5 L5 9 L10 3.5"
              fill="none"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            opacity: optimisticDone ? 0.5 : 1,
            textDecoration: optimisticDone ? "line-through" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}
        >
          {task.title}
        </div>
        {(sphere || due || task.recurrence) && (
          <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
            {sphere && (
              <span
                className="mono lower"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: sphereColor,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: sphereColor,
                  }}
                />
                {sphere.name}
              </span>
            )}
            {sphere && due && (
              <span style={{ color: "var(--ink-20)", fontSize: 12 }}>·</span>
            )}
            {due && (
              <span
                className="mono lower"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: due.tone === "warn" ? "var(--alert)" : "var(--ink-60)",
                }}
              >
                {due.text}
              </span>
            )}
            {task.recurrence && (
              <>
                <span style={{ color: "var(--ink-20)", fontSize: 12 }}>·</span>
                <span style={{ fontSize: 11, color: "var(--ink-40)" }}>↻</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

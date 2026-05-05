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
    return { text: days === 1 ? "вчера" : `просрочено ${days} дн.`, tone: "warn" };
  }
  const d = fromIsoDate(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) {
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
    return { text: wd, tone: "muted" };
  }
  return { text: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`, tone: "muted" };
}

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
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        background: "transparent",
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
        className="tap"
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: optimisticDone ? "none" : "1.5px solid var(--text-faint)",
          background: optimisticDone
            ? "linear-gradient(140deg, #14CAC4, #07918D)"
            : "transparent",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 220ms var(--ease-spring)",
          boxShadow: optimisticDone ? "0 4px 10px rgba(10,186,181,0.30)" : "none",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            opacity: optimisticDone ? 1 : 0,
            transform: optimisticDone ? "scale(1)" : "scale(0.4)",
            transition: "all 200ms var(--ease-spring)",
          }}
        >
          <path d="M3 7.5L6 10.5L11 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.005em",
          }}
        >
          {task.title}
        </div>
        {(sphere || due || task.recurrence) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {sphere && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: `${sphere.color}1F`,
                  border: `1px solid ${sphere.color}33`,
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: 0.01,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sphere.color }} />
                {sphere.name}
              </span>
            )}
            {due && (
              <span
                className="tnum"
                style={{
                  fontSize: 12,
                  color: due.tone === "warn" ? "var(--warn)" : "var(--text-muted)",
                  fontWeight: due.tone === "warn" ? 600 : 400,
                }}
              >
                {due.text}
              </span>
            )}
            {task.recurrence && (
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>↻</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const sphereColor = sphere?.color ?? "rgba(20,40,40,0.18)";

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
        padding: "13px 14px 13px 10px",
        background: "transparent",
        cursor: onEdit ? "pointer" : "default",
        borderRadius: 14,
        opacity: optimisticDone ? 0.35 : 1,
        transform: optimisticDone ? "translateX(8px)" : "translateX(0)",
        transition: "opacity 280ms var(--ease-out), transform 280ms var(--ease-out)",
        position: "relative",
      }}
    >
      {/* Sphere edge bar */}
      <span
        aria-hidden
        style={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 999,
          background: sphere
            ? `linear-gradient(180deg, ${sphereColor} 0%, ${sphereColor}AA 100%)`
            : "transparent",
          flexShrink: 0,
        }}
      />

      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || optimisticDone}
        aria-label="Отметить выполненной"
        className="tap"
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: optimisticDone ? "1.5px solid var(--accent)" : "1.5px solid var(--text-faint)",
          background: optimisticDone
            ? "linear-gradient(140deg, #14CAC4, #07918D)"
            : "transparent",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 250ms var(--ease-spring)",
          boxShadow: optimisticDone ? "0 4px 12px rgba(10,186,181,0.35)" : "none",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            opacity: optimisticDone ? 1 : 0,
            transform: optimisticDone ? "scale(1)" : "scale(0.4)",
            transition: "all 220ms var(--ease-spring)",
          }}
        >
          <path d="M3 7.5L6 10.5L11 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 450,
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            {sphere && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {sphere.emoji ? `${sphere.emoji} ` : ""}{sphere.name}
              </span>
            )}
            {due && (
              <>
                {sphere && <span style={{ color: "var(--text-faint)", fontSize: 11 }}>·</span>}
                <span
                  className="tnum"
                  style={{
                    fontSize: 12,
                    color: due.tone === "warn" ? "var(--warn)" : "var(--text-muted)",
                    fontWeight: due.tone === "warn" ? 500 : 400,
                  }}
                >
                  {due.text}
                </span>
              </>
            )}
            {task.recurrence && (
              <>
                <span style={{ color: "var(--text-faint)", fontSize: 11 }}>·</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>↻</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

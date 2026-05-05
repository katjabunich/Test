"use client";

import { useState, useTransition } from "react";
import type { Sphere, Task } from "@/lib/data";
import { completeTask } from "@/lib/actions";
import { SphereDot } from "@/components/SphereChip";
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
        padding: "12px 14px",
        background: "transparent",
        cursor: onEdit ? "pointer" : "default",
        borderRadius: 14,
        opacity: optimisticDone ? 0.4 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || optimisticDone}
        aria-label="Отметить выполненной"
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: optimisticDone ? "1.5px solid var(--accent)" : "1.5px solid var(--text-faint)",
          background: optimisticDone ? "var(--accent)" : "transparent",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 150ms ease",
        }}
      >
        {optimisticDone && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.5L6 10.5L11 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {task.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <SphereDot sphere={sphere} />
          {sphere && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sphere.name}</span>
          )}
          {due && (
            <>
              {sphere && <span style={{ color: "var(--text-faint)", fontSize: 12 }}>·</span>}
              <span
                style={{
                  fontSize: 12,
                  color: due.tone === "warn" ? "#C46E5A" : "var(--text-muted)",
                  fontWeight: due.tone === "warn" ? 500 : 400,
                }}
              >
                {due.text}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { Sphere, Task } from "@/lib/data";
import { completeTask } from "@/lib/actions";
import { isPast, isToday, fromIsoDate } from "@/lib/date";
import { feedbackTaskComplete } from "@/lib/feedback";
import { useLang, useWeekdaysShort } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";

function dueLabel(
  due: string | null,
  lang: Lang,
  weekdays: readonly string[],
): { text: string; tone: "muted" | "warn" } | null {
  if (!due) return null;
  if (isToday(due)) return { text: lang === "en" ? "today" : "сегодня", tone: "muted" };
  if (isPast(due)) {
    const d = fromIsoDate(due);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (lang === "en") {
      return { text: days === 1 ? "yesterday" : `${days}d ago`, tone: "warn" };
    }
    return { text: days === 1 ? "вчера" : `${days} дн назад`, tone: "warn" };
  }
  const d = fromIsoDate(due);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) {
    return { text: weekdays[d.getDay()], tone: "muted" };
  }
  if (lang === "en") {
    return { text: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`, tone: "muted" };
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
  const lang = useLang();
  const weekdaysShort = useWeekdaysShort();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const due = dueLabel(task.due_date, lang, weekdaysShort);
  const overdue = !!(task.due_date && isPast(task.due_date));
  const sphereColor = sphere?.color ?? "var(--ink-40)";

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    setOptimisticDone(true);
    feedbackTaskComplete();
    startTransition(async () => {
      try {
        await completeTask(task.id);
      } catch {
        setOptimisticDone(false);
      }
    });
  }

  // Sphere-tinted paper card; overdue keeps its sphere tint and gets a
  // clay accent stripe on the left edge so the sphere code stays legible
  // even on a list full of overdue tasks.
  const cardBg = sphere
    ? `${sphere.color}1F` // ~12% tint of the sphere colour
    : "var(--paper-warm)";
  const cardBorder = sphere
    ? `${sphere.color}40` // ~25% of the sphere colour
    : "var(--ink-05)";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit?.(task)}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: overdue ? "3px solid var(--alert)" : `1px solid ${cardBorder}`,
        borderRadius: 16,
        padding: overdue ? "12px 14px 12px 12px" : "12px 14px",
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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: sphereColor,
                  letterSpacing: "-0.005em",
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
                className="tnum"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: due.tone === "warn" ? "var(--alert)" : "var(--ink-60)",
                  letterSpacing: "-0.005em",
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
            {task.remind_at && !task.reminded_at && (
              <>
                <span style={{ color: "var(--ink-20)", fontSize: 12 }}>·</span>
                <span
                  aria-label="Напоминание включено"
                  style={{ fontSize: 11, color: "var(--ink-40)" }}
                >
                  🔔
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

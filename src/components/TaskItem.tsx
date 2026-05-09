"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere, Task } from "@/lib/data";
import { completeTask, deferTask } from "@/lib/actions";
import { isPast, isToday, fromIsoDate } from "@/lib/date";
import { feedbackTaskComplete } from "@/lib/feedback";
import { useT, useLang, useWeekdaysShort } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";
import { Icons } from "@/components/Icons";

/* Swipe behaviour constants. */
const COMMIT_THRESHOLD = 80; // px past which release commits the action
const REVEAL_HINT = 56; // px at which the action label appears at full opacity
const AXIS_LOCK = 8; // px of movement that locks the gesture to one axis
const VERTICAL_GIVE = 14; // vertical movement allowed before we cancel the swipe

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
    chip + due label below the title. Swipe-left commits "Готово", swipe-
    right defers to tomorrow. */
export default function TaskItem({
  task,
  sphere,
  onEdit,
}: {
  task: Task;
  sphere: Sphere | null;
  onEdit?: (task: Task) => void;
}) {
  const t = useT();
  const lang = useLang();
  const weekdaysShort = useWeekdaysShort();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [optimisticDeferred, setOptimisticDeferred] = useState(false);
  const [isPending, startTransition] = useTransition();
  const due = dueLabel(task.due_date, lang, weekdaysShort);
  const overdue = !!(task.due_date && isPast(task.due_date));
  const sphereColor = sphere?.color ?? "var(--ink-40)";

  /* Swipe state. dx is the live offset; isDragging tells us whether to
     suspend the snap-back transition while the finger is still down. */
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const lockedAxis = useRef<"horizontal" | "vertical" | null>(null);
  const moved = useRef(false);

  function handleComplete(e?: React.MouseEvent) {
    e?.stopPropagation();
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

  function handleDefer() {
    setOptimisticDeferred(true);
    feedbackTaskComplete();
    startTransition(async () => {
      try {
        await deferTask(task.id, 1);
      } catch {
        setOptimisticDeferred(false);
        setDx(0);
      }
    });
  }

  /* Skip the swipe gesture when the pointer started on a button or other
     interactive descendant — quick-tap on the checkbox should still
     toggle complete without competing with the swipe. */
  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest("button, a, input, [role='button']:not([data-task-row])");
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(e.target)) return;
    if (optimisticDone || optimisticDeferred) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lockedAxis.current = null;
    moved.current = false;
    setIsDragging(true);
    /* Capture so move events keep arriving even if the finger leaves the
       row's box (taller swipes off-screen on iOS). */
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* unsupported on some older Safari builds */
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (lockedAxis.current === null) {
      if (Math.abs(deltaX) > AXIS_LOCK || Math.abs(deltaY) > AXIS_LOCK) {
        lockedAxis.current =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }
    }

    if (lockedAxis.current === "vertical") return;
    if (lockedAxis.current === "horizontal") {
      if (Math.abs(deltaY) > VERTICAL_GIVE * 4) {
        // Big vertical drift mid-swipe — abort.
        setDx(0);
        setIsDragging(false);
        return;
      }
      moved.current = true;
      // Light resistance past commit threshold so the row doesn't run away.
      const sign = Math.sign(deltaX);
      const absMoved = Math.abs(deltaX);
      const dampened =
        absMoved > COMMIT_THRESHOLD
          ? COMMIT_THRESHOLD + (absMoved - COMMIT_THRESHOLD) * 0.5
          : absMoved;
      setDx(sign * dampened);
    }
  }

  function endSwipe(commit: boolean) {
    setIsDragging(false);
    lockedAxis.current = null;
    if (!commit) {
      setDx(0);
      return;
    }
    if (dx <= -COMMIT_THRESHOLD) {
      // Swipe left → complete. Animate the row out to the left.
      setDx(-window.innerWidth);
      handleComplete();
    } else if (dx >= COMMIT_THRESHOLD) {
      // Swipe right → defer. Animate to the right.
      setDx(window.innerWidth);
      handleDefer();
    } else {
      setDx(0);
    }
  }

  function onPointerUp() {
    endSwipe(true);
  }

  function onPointerCancel() {
    endSwipe(false);
  }

  function onClick() {
    /* If the pointer moved enough to register as a swipe, suppress the
       click — otherwise the edit modal would pop on every release. */
    if (moved.current) {
      moved.current = false;
      return;
    }
    onEdit?.(task);
  }

  /* Reset dx if completion or deferral fails and we revert. */
  useEffect(() => {
    if (!optimisticDone && !optimisticDeferred && dx !== 0 && !isDragging) {
      const t = setTimeout(() => setDx(0), 320);
      return () => clearTimeout(t);
    }
  }, [optimisticDone, optimisticDeferred, dx, isDragging]);

  // Sphere-tinted paper card; overdue keeps its sphere tint and gets a
  // clay accent stripe on the left edge so the sphere code stays legible
  // even on a list full of overdue tasks.
  const cardBg = sphere
    ? `${sphere.color}1F` // ~12% tint of the sphere colour
    : "var(--paper-warm)";
  const cardBorder = sphere
    ? `${sphere.color}40` // ~25% of the sphere colour
    : "var(--ink-05)";

  /* Reveal-action progress: 0 = idle, 1 = at COMMIT_THRESHOLD. Used to fade
     the action chip in as the row slides off it. */
  const revealProgress = Math.min(1, Math.abs(dx) / REVEAL_HINT);
  const swipeDir: "left" | "right" | null =
    dx < -2 ? "left" : dx > 2 ? "right" : null;
  const past = Math.abs(dx) >= COMMIT_THRESHOLD;

  const collapsing = optimisticDone || optimisticDeferred;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        maxHeight: collapsing ? 0 : 140,
        marginBottom: collapsing ? -7 : 0,
        opacity: collapsing ? 0 : 1,
        transition:
          "max-height 320ms cubic-bezier(0.34, 1.4, 0.64, 1), margin-bottom 320ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 240ms var(--ease-out)",
      }}
    >
      {/* Action background — visible underneath the row when swiping. */}
      {swipeDir && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              swipeDir === "left" ? "var(--mint-deep)" : "var(--butter)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: swipeDir === "left" ? "flex-end" : "flex-start",
            padding: "0 22px",
            color: swipeDir === "left" ? "var(--paper)" : "var(--ink)",
            opacity: revealProgress,
            transform: past ? "scale(1.01)" : "scale(1)",
            transition: isDragging
              ? "opacity 80ms linear"
              : "opacity 220ms var(--ease-out), transform 220ms var(--ease-out)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {swipeDir === "left" ? (
              <>
                <Icons.Check size={18} stroke="currentColor" strokeWidth={2.4} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t("tasks.swipe_done")}
                </span>
              </>
            ) : (
              <>
                <Icons.Calendar size={18} stroke="currentColor" strokeWidth={2} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t("tasks.swipe_defer")}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Foreground row — translates with the swipe. */}
      <div
        role="button"
        tabIndex={0}
        data-task-row
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
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
          opacity: optimisticDone || optimisticDeferred ? 0.4 : 1,
          transform: `translateX(${dx}px)`,
          transition: isDragging
            ? "none"
            : "transform 280ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 280ms var(--ease-out)",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || optimisticDone || optimisticDeferred}
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
    </div>
  );
}

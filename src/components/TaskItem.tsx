"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere, Task } from "@/lib/data";
import { completeTask, deferTask } from "@/lib/actions";
import { isPast, isToday, fromIsoDate } from "@/lib/date";
import { feedbackTaskComplete } from "@/lib/feedback";
import { useT, useLang, useMonths, useWeekdaysShort } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";
import { Icons } from "@/components/Icons";
import { snack } from "@/components/Snackbar";

/* Swipe behaviour constants. */
const COMMIT_THRESHOLD = 80; // px past which release commits the action
const REVEAL_HINT = 56; // px at which the action label appears at full opacity
const AXIS_LOCK = 8; // px of movement that locks the gesture to one axis
const VERTICAL_GIVE = 14; // vertical movement allowed before we cancel the swipe

function dueLabel(
  due: string | null,
  lang: Lang,
  weekdays: readonly string[],
  months: readonly string[],
  t: (k: string, vars?: Record<string, string | number>) => string,
): { text: string } | null {
  if (!due) return null;
  if (isToday(due)) return { text: lang === "en" ? "today" : "сегодня" };
  if (isPast(due)) {
    /* Neutral, guilt-free overdue meta: «с 12 авг» / "since Aug 12".
       Russian month names in the dict are full genitive — clip to the
       conventional 3-letter shorthand; English is already short. */
    const d = fromIsoDate(due);
    const month = lang === "ru" ? months[d.getMonth()].slice(0, 3) : months[d.getMonth()];
    const date =
      lang === "en" ? `${month} ${d.getDate()}` : `${d.getDate()} ${month}`;
    return { text: t("tasks.overdue_since", { date }) };
  }
  const d = fromIsoDate(due);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) {
    return { text: weekdays[d.getDay()] };
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return {
    text: lang === "en" ? `${dd}/${mm}` : `${dd}.${mm}`,
  };
}

/** Task row per «Рассвет» A2, Tiimo composition: sphere-tinted card
    (white mixed with the sphere colour — no left colour bar), a 40px
    sphere icon-avatar on the LEFT (sphere emoji in a tinted circle),
    title + meta next to it, and the round muted-sphere-bordered
    checkbox moved to the RIGHT edge. Swipe-left commits "Готово",
    swipe-right defers to tomorrow. */
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
  const months = useMonths();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [optimisticDeferred, setOptimisticDeferred] = useState(false);
  const [isPending, startTransition] = useTransition();
  const due = dueLabel(task.due_date, lang, weekdaysShort, months, t);
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
    /* Show the undo snackbar regardless of recurrence — even for a
       recurring task, "uncomplete" of the just-completed instance is
       a sensible single-step revert (it leaves the newly-spawned
       next-occurrence in place; user can delete that manually if
       they really meant nothing). */
    snack(`${t("tasks.completed_snack")} · ${task.title}`, { taskId: task.id });
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
    /* No undo on defer — reverting the date push needs the previous
       due_date, which we don't keep. User can edit the task to revert. */
    snack(`${t("tasks.deferred_snack")} · ${task.title}`);
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

  /* Sphere-tinted card — the tint carries the sphere colour (the old
     left colour bar is gone); a task without a sphere sits on warm
     paper. Overdue gets no red anywhere (--alert is reserved for
     destructive actions). */
  const cardBg = sphere
    ? `color-mix(in srgb, #FFFFFF 82%, ${sphere.color})`
    : "var(--paper-warm)";
  /* Muted version of the (often bright, DB-seeded) sphere colour for the
     check-circle border and chip — calmer on the tinted surface. */
  const sphereMuted = `color-mix(in srgb, ${sphereColor} 70%, #3B2E26)`;

  /* Reveal-action progress: 0 = idle, 1 = at COMMIT_THRESHOLD. Used to fade
     the action chip in as the row slides off it. */
  const revealProgress = Math.min(1, Math.abs(dx) / REVEAL_HINT);
  const swipeDir: "left" | "right" | null =
    dx < -2 ? "left" : dx > 2 ? "right" : null;
  const past = Math.abs(dx) >= COMMIT_THRESHOLD;

  const collapsing = optimisticDone || optimisticDeferred;

  return (
    <div
      className={collapsing ? "task-collapse" : undefined}
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        maxHeight: 140,
        transformOrigin: "top center",
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
              swipeDir === "left" ? "var(--terra)" : "var(--butter)",
            borderRadius: "var(--radius-lg)",
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
          border: "none",
          borderRadius: "var(--radius-lg)",
          /* Tinted surfaces need almost no lift — a whisper of warm
             shadow keeps the edge without the floating-card look. */
          boxShadow: "0 1px 3px rgba(105,74,50,0.05)",
          padding: "14px 16px",
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
      {/* Sphere icon-avatar — the row's identity anchor on the left:
          sphere emoji inside a circle tinted a step deeper than the
          card; a task without an emoji (or without a sphere) gets a
          quiet 10px dot instead. */}
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          flexShrink: 0,
          background: `color-mix(in srgb, #FFFFFF 75%, ${sphereColor})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {sphere?.emoji ? (
          sphere.emoji
        ) : (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: sphereMuted,
              display: "block",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink-strong)",
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
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
            {sphere && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: sphereMuted,
                  letterSpacing: "-0.005em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    background: sphereMuted,
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
                  fontWeight: 600,
                  color: "var(--ink-40)",
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

      {/* Round checkbox — moved to the right edge, Tiimo-style. */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || optimisticDone || optimisticDeferred}
        aria-label="Отметить выполненной"
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          border: `2.5px solid ${optimisticDone ? "var(--terra)" : sphereMuted}`,
          background: optimisticDone ? "var(--terra)" : "transparent",
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
            width="14"
            height="14"
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
      </div>
    </div>
  );
}

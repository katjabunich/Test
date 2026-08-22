"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Icons } from "@/components/Icons";
import { snack } from "@/components/Snackbar";
import { Card, PillButton, ScreenHeader } from "@/components/ui";
import {
  rescheduleAllOverdueToToday,
  spreadOverdueAcrossWeek,
  archiveAllOverdue,
  updateTask,
} from "@/lib/actions";
import { isPast, isToday, today, fromIsoDate, addDays } from "@/lib/date";
import { computeStreak, groupLogsByHabit, isScheduledOn } from "@/lib/habits";
import { updateDisplayName } from "@/lib/profile";
import { useT, useLang, useMonths } from "@/lib/i18n/client";

function pickGreeting(t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 5)  return t("today.night");
  if (h < 12) return t("today.morning");
  if (h < 18) return t("today.afternoon");
  return t("today.evening");
}

/* ReturnCard removed by Katja's request — bulk overdue actions now live
   as a compact pill row inside the expanded «Ждут своего часа» section. */

export default function TodayView({
  todayTasks,
  upcomingTasks,
  spheres,
  habits,
  logs,
  doneToday,
  initialName,
}: {
  todayTasks: Task[];
  upcomingTasks: Task[];
  spheres: Sphere[];
  habits: Habit[];
  logs: HabitLog[];
  /** Tasks completed since start of today — counted server-side. */
  doneToday: number;
  initialName: string | null;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const lang = useLang();
  const months = useMonths();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [name, setName] = useState<string | null>(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  /* "Waiting for later" section (overdue lives here, calm, collapsed). */
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [movedIds, setMovedIds] = useState<ReadonlySet<string>>(new Set());
  const [isMovePending, startMoveTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();

  /* Bulk overdue actions (ex-ReturnCard) — a compact pill row inside the
     expanded waiting section. */
  function bulkAct(fn: () => Promise<void>) {
    startBulkTransition(async () => {
      try {
        await fn();
        snack("✓");
        setWaitingOpen(false);
      } catch { /* server revalidate will reconcile */ }
    });
  }

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  function startNameEdit() {
    setNameDraft(name ?? "");
    setEditingName(true);
  }
  function commitName() {
    const trimmed = nameDraft.trim().slice(0, 30);
    setName(trimmed || null);
    setEditingName(false);
    // Fire-and-forget: cloud-persist via Supabase auth user_metadata.
    void updateDisplayName(trimmed).catch((e) => {
      console.error("updateDisplayName:", e);
    });
  }

  // ?new=1 from BottomNav FAB → open task creation
  useEffect(() => {
    if (search.get("new") === "1") {
      setEditing(null);
      setModalOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [search, router]);

  const sphereById = useMemo(() => {
    const m = new Map<string, Sphere>();
    spheres.forEach((s) => m.set(s.id, s));
    return m;
  }, [spheres]);

  /* Sun decor variant: Katja picked "c" (full visible disc + glow,
     «солнце не отрезай»). ?sun=a|b stay available for future tuning. */
  const sunParam = search.get("sun");
  const sunVariant = sunParam === "a" || sunParam === "b" ? sunParam : "c";

  const todayIso = today();
  const dateObj = fromIsoDate(todayIso);
  const habitsToday = habits.filter((h) => isScheduledOn(h, todayIso));
  const logsByHabit = useMemo(() => groupLogsByHabit(logs), [logs]);

  const doneTodaySet = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => {
      if (l.date === todayIso) s.add(l.habit_id);
    });
    return s;
  }, [logs, todayIso]);

  /* Split: the main list is strictly "today" (due today / do_today);
     overdue tasks move to the calm waiting section below. A task the
     user just bumped via «На сегодня» renders optimistically in the
     main list with today's date until the server round-trip lands. */
  const { mainTasks, waitingTasks } = useMemo(() => {
    const main: Task[] = [];
    const waiting: Task[] = [];
    for (const task of todayTasks) {
      const overdue = !!(task.due_date && isPast(task.due_date));
      if (!overdue) {
        main.push(task);
      } else if (movedIds.has(task.id)) {
        main.push({ ...task, due_date: todayIso });
      } else {
        waiting.push(task);
      }
    }
    // Due-today first, then dateless do_today; stable within ranks.
    const rank = (task: Task) => (task.due_date && isToday(task.due_date) ? 0 : 1);
    main.sort((a, b) => rank(a) - rank(b));
    waiting.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
    return { mainTasks: main, waitingTasks: waiting };
  }, [todayTasks, movedIds, todayIso]);

  const overdueCount = waitingTasks.length;
  const totalToday = mainTasks.length + doneToday;

  function moveToToday(id: string) {
    setMovedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    snack(t("today.moved_snack"));
    startMoveTransition(async () => {
      try {
        await updateTask(id, { due_date: todayIso });
      } catch {
        setMovedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }

  function weekDoneFor(habitId: string): number {
    const logged = logsByHabit.get(habitId);
    if (!logged) return 0;
    let n = 0;
    for (let i = 0; i < 7; i++) {
      if (logged.has(addDays(todayIso, -i))) n++;
    }
    return n;
  }

  return (
    <>
      {/* isolation: isolate gives this container its own stacking context —
         without it the z-index:-1 decor paints BEHIND body's background
         and the sun is simply invisible (the original "куда делось солнце"
         bug). */}
      <div style={{ padding: "8px 0 0", position: "relative", isolation: "isolate" }}>
        {/* Dawn decor — soft gradient zone behind the header plus a large
           warm radial glow bleeding off the top-right edge. Purely
           decorative, only on this screen; the clipping wrapper keeps the
           glow from widening the page, and z-index -1 keeps it behind all
           in-flow content while staying above the cream page ground. */}
        <div
          aria-hidden
          style={{
            /* Extend up past the container padding AND the iOS safe-area
               (status bar) so the sky truly starts at the physical top of
               the screen in standalone PWA mode. */
            position: "absolute",
            top: "calc(-8px - env(safe-area-inset-top, 0px))",
            left: 0,
            right: 0,
            height: "calc(368px + env(safe-area-inset-top, 0px))",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          {/* Sky band — must clearly separate from the cream ground. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: sunVariant === "a" ? "calc(260px + env(safe-area-inset-top, 0px))" : "calc(320px + env(safe-area-inset-top, 0px))",
              background:
                "linear-gradient(180deg, #F6DFC2 0%, rgba(246,223,194,0) 100%)",
            }}
          />
          {sunVariant === "a" && (
            <div
              style={{
                position: "absolute",
                top: "calc(-120px + env(safe-area-inset-top, 0px))",
                right: -90,
                width: 420,
                height: 420,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(238,178,116,0.68) 0%, rgba(238,178,116,0) 70%)",
              }}
            />
          )}
          {sunVariant === "b" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "calc(-230px + env(safe-area-inset-top, 0px))",
                  right: -180,
                  width: 640,
                  height: 640,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(240,178,110,0.55) 0%, rgba(240,178,110,0) 72%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(-60px + env(safe-area-inset-top, 0px))",
                  right: -30,
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(244,166,92,0.5) 0%, rgba(244,166,92,0) 65%)",
                }}
              />
            </>
          )}
          {sunVariant === "c" && (
            <>
              {/* Glow centred on the disc; the disc itself sits FULLY
                 inside the viewport («солнце не отрезай»). */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(-155px + env(safe-area-inset-top, 0px))",
                  right: -151,
                  width: 460,
                  height: 460,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(240,178,110,0.5) 0%, rgba(240,178,110,0) 70%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(14px + env(safe-area-inset-top, 0px))",
                  right: 18,
                  width: 122,
                  height: 122,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 46% 44%, #F7C88E 0%, #F0AE6C 58%, rgba(240,174,108,0) 76%)",
                }}
              />
            </>
          )}
        </div>

        {/* Header: tiny date + big plump greeting. paddingRight keeps the
           greeting from running under the sun disc (right ~140px zone). */}
        <ScreenHeader
          style={{ paddingRight: 120 }}
          label={
            lang === "en" ? (
              <>
                {months[dateObj.getMonth()]}{" "}
                <span className="tnum">{dateObj.getDate()}</span>
              </>
            ) : (
              <>
                <span className="tnum">{dateObj.getDate()}</span>{" "}
                {months[dateObj.getMonth()]}
              </>
            )
          }
        >
          {pickGreeting(t)},{" "}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitName();
                } else if (e.key === "Escape") {
                  setEditingName(false);
                }
              }}
              placeholder={t("today.name_ph")}
              maxLength={30}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                font: "inherit",
                color: "var(--terra)",
                width: `${Math.max(4, nameDraft.length || 5)}ch`,
                padding: 0,
                letterSpacing: "inherit",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={startNameEdit}
              className="tap"
              style={{
                border: "none",
                padding: 0,
                font: "inherit",
                letterSpacing: "inherit",
                cursor: "pointer",
                /* Gradient text needs the background clipped to the
                   glyphs; the empty-name placeholder keeps flat terra so
                   its dotted underline (drawn in `color`) stays visible. */
                ...(name
                  ? {
                      background: "linear-gradient(90deg, #C4673F, #D9A05B)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }
                  : {
                      background: "transparent",
                      color: "var(--terra)",
                      textDecoration: "underline",
                      textDecorationStyle: "dotted" as const,
                      textDecorationThickness: "1.5px",
                      textUnderlineOffset: "5px",
                    }),
              }}
            >
              {name ?? t("today.name_ph")}
            </button>
          )}
          !
        </ScreenHeader>

        {/* Habit rings — left-aligned, fixed gap so adding a 2nd habit
           stays next to the first instead of jumping to the far edge. */}
        {habitsToday.length > 0 && (
          <div
            style={{
              padding: "0 20px 22px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 14,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {habitsToday.map((h) => (
              <HabitRing
                key={h.id}
                habit={h}
                doneToday={doneTodaySet.has(h.id)}
                weekDone={weekDoneFor(h.id)}
                streak={computeStreak(h, logsByHabit.get(h.id) ?? new Set())}
                size={56}
              />
            ))}
          </div>
        )}

        {/* Progress bar — done/total includes tasks already completed today */}
        {totalToday > 0 && (
          <div style={{ padding: "0 20px 6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-40)",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--ink-05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #C4673F, #D9A05B)",
                    width: `${Math.round((doneToday / totalToday) * 100)}%`,
                    transition: "width 600ms var(--ease-out)",
                  }}
                />
              </div>
              <span className="tnum" style={{ flexShrink: 0 }}>
                {doneToday} {t("today.progress_of")} {totalToday}
              </span>
            </div>
          </div>
        )}

        {/* Flat task list — today only, all tasks equal */}
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {mainTasks.length === 0 && (
            <Card
              style={{
                padding: "28px 22px",
                textAlign: "center",
                color: "var(--ink-60)",
                fontSize: 14.5,
                lineHeight: 1.5,
              }}
            >
              {upcomingTasks.length > 0 ? (
                <>
                  {t("today.empty_done_pre")}
                  <span className="tnum mark-butter">{upcomingTasks.length}</span>
                  {t("today.empty_done_post")}
                </>
              ) : (
                t("today.empty_fresh")
              )}
            </Card>
          )}

          {mainTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              sphere={
                task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null
              }
              onEdit={(t) => {
                setEditing(t);
                setModalOpen(true);
              }}
            />
          ))}
        </div>

        {/* «Ждут своего часа» — calm collapsed home for overdue tasks */}
        {waitingTasks.length > 0 && (
          <div style={{ padding: "20px 20px 0" }}>
            <button
              type="button"
              className="tap"
              onClick={() => setWaitingOpen((v) => !v)}
              aria-expanded={waitingOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                padding: "4px 2px",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--ink-40)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("today.waiting_title")}
              {" · "}
              <span className="tnum">{waitingTasks.length}</span>
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  transform: waitingOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 240ms var(--ease-out)",
                }}
              >
                <Icons.ChevronDown size={16} stroke="currentColor" strokeWidth={2.2} />
              </span>
            </button>

            {/* Smooth expand/collapse: the 0fr→1fr grid row transitions
               height without measuring content; visibility snaps at the
               transition edge and keeps collapsed pills out of tab order. */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: waitingOpen ? "1fr" : "0fr",
                opacity: waitingOpen ? 1 : 0,
                visibility: waitingOpen ? "visible" : "hidden",
                transition:
                  "grid-template-rows 300ms var(--ease-out), opacity 260ms var(--ease-out), visibility 300ms",
              }}
              aria-hidden={!waitingOpen}
            >
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    marginTop: 12,
                  }}
                >
                {waitingTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <TaskItem
                      task={task}
                      sphere={
                        task.sphere_id
                          ? sphereById.get(task.sphere_id) ?? null
                          : null
                      }
                      onEdit={(t) => {
                        setEditing(t);
                        setModalOpen(true);
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <PillButton
                        onClick={() => moveToToday(task.id)}
                        disabled={isMovePending}
                        variant="filled"
                        color="var(--terra)"
                        style={{ padding: "8px 16px", fontSize: 13, color: "#FBF3EA" }}
                      >
                        {t("today.move_to_today")}
                      </PillButton>
                    </div>
                  </div>
                ))}

                {/* Bulk actions for the whole backlog (ex-ReturnCard) */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    paddingTop: 2,
                  }}
                >
                  <PillButton
                    onClick={() => bulkAct(rescheduleAllOverdueToToday)}
                    disabled={isBulkPending}
                    className="press-tint"
                    style={{ padding: "9px 14px", fontSize: 13 }}
                  >
                    {t("today.return_today")}
                  </PillButton>
                  <PillButton
                    onClick={() => bulkAct(spreadOverdueAcrossWeek)}
                    disabled={isBulkPending}
                    className="press-tint"
                    style={{ padding: "9px 14px", fontSize: 13 }}
                  >
                    {t("today.return_week")}
                  </PillButton>
                  <PillButton
                    onClick={() => bulkAct(archiveAllOverdue)}
                    disabled={isBulkPending}
                    className="press-tint"
                    style={{ padding: "9px 14px", fontSize: 13 }}
                  >
                    {t("today.return_clean")}
                  </PillButton>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        spheres={spheres}
      />
    </>
  );
}

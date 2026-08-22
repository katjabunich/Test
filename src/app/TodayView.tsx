"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Icons } from "@/components/Icons";
import { snack } from "@/components/Snackbar";
import { Card, FocusCard, PillButton, ScreenHeader } from "@/components/ui";
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

/** Russian plural — 1 → одна, 2-4 → две/три/четыре, 5+ → много. */
function pluralRu(n: number): "one" | "few" | "many" {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "few";
  return "many";
}

/** Sand focus card offering batch actions for a big overdue backlog.
    Rendered only when overdueCount >= 3 — one or two stragglers live
    quietly in the "waiting" section instead. */
function ReturnCard({ overdueCount }: { overdueCount: number }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (overdueCount < 3 || dismissed) return null;

  function act(fn: () => Promise<void>, msg: string) {
    startTransition(async () => {
      try {
        await fn();
        snack(msg);
        setDismissed(true);
      } catch { /* fall through */ }
    });
  }

  const plural = pluralRu(overdueCount);
  const subKey =
    plural === "one"
      ? "today.return_sub_one"
      : plural === "few"
      ? "today.return_sub_few"
      : "today.return_sub_many";
  const subContent = t(subKey, { n: overdueCount });

  return (
    <div style={{ padding: "0 20px 14px" }}>
      <FocusCard bg="#F1DDC9">
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
            color: "var(--ink-strong)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 6,
          }}
        >
          {t("today.return_title")}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink-80)",
            lineHeight: 1.4,
            marginBottom: 18,
          }}
        >
          {subContent}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <PillButton
            onClick={() => act(rescheduleAllOverdueToToday, "✓")}
            disabled={isPending}
            style={{ width: "100%", padding: "14px 16px" }}
          >
            {t("today.return_today")}
          </PillButton>
          <PillButton
            onClick={() => act(spreadOverdueAcrossWeek, "✓")}
            disabled={isPending}
            style={{ width: "100%", padding: "14px 16px" }}
          >
            {t("today.return_week")}
          </PillButton>
          <PillButton
            onClick={() => act(archiveAllOverdue, "✓")}
            disabled={isPending}
            style={{ width: "100%", padding: "14px 16px" }}
          >
            {t("today.return_clean")}
          </PillButton>
        </div>
      </FocusCard>
    </div>
  );
}

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
      <div style={{ padding: "8px 0 0", position: "relative" }}>
        {/* Dawn decor — soft gradient zone behind the header plus a large
           warm radial glow bleeding off the top-right edge. Purely
           decorative, only on this screen; the clipping wrapper keeps the
           glow from widening the page, and z-index -1 keeps it behind all
           in-flow content while staying above the cream page ground. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 240,
              background:
                "linear-gradient(180deg, #F7E7D3 0%, rgba(247,231,211,0) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -140,
              right: -110,
              width: 340,
              height: 340,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(232,179,126,0.5) 0%, rgba(232,179,126,0) 68%)",
            }}
          />
        </div>

        {/* Header: tiny date + big plump greeting */}
        <ScreenHeader
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
                background: "transparent",
                border: "none",
                padding: 0,
                font: "inherit",
                letterSpacing: "inherit",
                color: "var(--terra)",
                cursor: "pointer",
                textDecoration: name ? "none" : "underline",
                textDecorationStyle: name ? undefined : "dotted",
                textDecorationThickness: name ? undefined : "1.5px",
                textUnderlineOffset: name ? undefined : "5px",
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

        {/* Return card — batch actions, only for a real backlog (3+) */}
        <ReturnCard overdueCount={overdueCount} />

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
                    transition: "width 400ms var(--ease-out)",
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

            {waitingOpen && (
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
              </div>
            )}
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

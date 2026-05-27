"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Icons, SphereIcon } from "@/components/Icons";
import { snack } from "@/components/Snackbar";
import {
  rescheduleAllOverdueToToday,
  spreadOverdueAcrossWeek,
  archiveAllOverdue,
} from "@/lib/actions";
import { isPast, isToday, today, fromIsoDate, addDays } from "@/lib/date";
import { computeStreak, groupLogsByHabit, isScheduledOn } from "@/lib/habits";
import { completeTask } from "@/lib/actions";
import { updateDisplayName } from "@/lib/profile";
import { feedbackTaskComplete } from "@/lib/feedback";
import { useT, useLang, useMonths, useWeekdaysShort } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";

function pickGreeting(t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 5)  return t("today.night");
  if (h < 12) return t("today.morning");
  if (h < 18) return t("today.afternoon");
  return t("today.evening");
}

function formatDue(
  due: string | null,
  overdue: boolean,
  lang: Lang,
  months: readonly string[],
  weekdays: readonly string[],
): string {
  const today_s = lang === "en" ? "today" : "сегодня";
  const yesterday_s = lang === "en" ? "yesterday" : "вчера";
  if (!due) return today_s;
  if (isToday(due)) return today_s;
  if (overdue) return yesterday_s;
  const d = fromIsoDate(due);
  if (lang === "en") {
    return `${weekdays[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
  }
  return `${weekdays[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
}

const labelStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink-40)",
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
} as const;

/** Section heading used between groups on Today/Tasks/Settings/Habits. */
const sectionHeadingStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 16px",
  borderRadius: 999,
  background: "#FFFFFF",
  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--ink-60)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
} as const;

function ReturnCard({ overdueCount }: { overdueCount: number }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (overdueCount === 0 || dismissed) return null;

  const btnStyle = {
    flex: 1,
    padding: "12px 8px",
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    fontWeight: 700 as const,
    cursor: isPending ? ("default" as const) : ("pointer" as const),
    opacity: isPending ? 0.5 : 1,
    transition: "opacity 200ms",
  };

  function act(fn: () => Promise<void>, msg: string) {
    startTransition(async () => {
      try {
        await fn();
        snack(msg);
        setDismissed(true);
      } catch { /* fall through */ }
    });
  }

  return (
    <div
      style={{
        margin: "0 18px 12px",
        background: "#FFFFFF",
        borderRadius: 24,
        boxShadow: "var(--shadow-card-lg)",
        padding: "22px 20px 18px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-emphasis)",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--ink-strong)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          marginBottom: 6,
        }}
      >
        {t("today.return_title")}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--ink-60)",
          lineHeight: 1.4,
          marginBottom: 18,
        }}
      >
        {t("today.return_sub_pre")}
        <span className="tnum" style={{ fontWeight: 700, color: "var(--ink)" }}>
          {overdueCount}
        </span>
        {" "}{t("today.progress_tasks")}
        {t("today.return_sub_post")}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="tap"
          onClick={() => act(rescheduleAllOverdueToToday, "✓")}
          disabled={isPending}
          style={{
            ...btnStyle,
            background: "var(--ink-strong)",
            color: "#FFFFFF",
          }}
        >
          {t("today.return_today")}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="tap"
          onClick={() => act(spreadOverdueAcrossWeek, "✓")}
          disabled={isPending}
          style={{
            ...btnStyle,
            background: "var(--paper-deep)",
            color: "var(--ink)",
          }}
        >
          {t("today.return_week")}
        </button>
        <button
          type="button"
          className="tap"
          onClick={() => act(archiveAllOverdue, "✓")}
          disabled={isPending}
          style={{
            ...btnStyle,
            background: "var(--paper-deep)",
            color: "var(--ink)",
          }}
        >
          {t("today.return_clean")}
        </button>
      </div>
    </div>
  );
}

export default function TodayView({
  todayTasks,
  upcomingTasks,
  spheres,
  habits,
  logs,
  initialName,
}: {
  todayTasks: Task[];
  upcomingTasks: Task[];
  spheres: Sphere[];
  habits: Habit[];
  logs: HabitLog[];
  initialName: string | null;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const lang = useLang();
  const months = useMonths();
  const weekdaysShort = useWeekdaysShort();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [name, setName] = useState<string | null>(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // Sort: overdue → today → do_today no-date
  const sortedTodayTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      const rank = (task: Task) => {
        if (task.due_date && isPast(task.due_date)) return 0;
        if (task.due_date && isToday(task.due_date)) return 1;
        return 2;
      };
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      return 0;
    });
  }, [todayTasks]);

  const overdueCount = sortedTodayTasks.filter(
    (t) => t.due_date && isPast(t.due_date),
  ).length;
  const doneToday = 0; // completed tasks are filtered out server-side
  const totalToday = sortedTodayTasks.length;
  const habitsDoneCount = habitsToday.filter((h) => doneTodaySet.has(h.id)).length;
  const habitsTotal = habitsToday.length;

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
      <div style={{ padding: "8px 0 0" }}>
        {/* Header: tiny date + big greeting */}
        <div
          style={{
            padding: "8px 22px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>
              {lang === "en" ? (
                <>
                  {months[dateObj.getMonth()]}{" "}
                  <span className="tnum">{dateObj.getDate()}</span>
                </>
              ) : (
                <>
                  <span className="tnum">{dateObj.getDate()}</span>{" "}
                  {months[dateObj.getMonth()]}
                </>
              )}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-emphasis)",
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                color: "var(--ink-strong)",
                margin: 0,
              }}
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
                    color: "var(--mint-deep)",
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
                    color: "var(--mint-deep)",
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
            </h1>
          </div>
        </div>

        {/* Habit rings — left-aligned, fixed gap so adding a 2nd habit
           stays next to the first instead of jumping to the far edge. */}
        {habitsToday.length > 0 && (
          <div
            style={{
              padding: "0 22px 22px",
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

        {/* Return card — shown when overdue tasks exist */}
        <ReturnCard overdueCount={overdueCount} />

        {/* Progress bar */}
        {totalToday > 0 && (
          <div style={{ padding: "0 22px 6px" }}>
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
                    background: "var(--mint-deep)",
                    width: totalToday > 0 ? `${Math.round((doneToday / totalToday) * 100)}%` : "0%",
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

        {/* Flat task list — no hero, all tasks equal */}
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedTodayTasks.length === 0 && (
            <div
              style={{
                background: "#FFFFFF",
                border: "none",
                borderRadius: 28,
                boxShadow: "var(--shadow-card)",
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
            </div>
          )}

          {sortedTodayTasks.map((task) => (
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

/** Hero "next task" card — coloured with the sphere's hue, with corner
    sphere icon, sentence-case time, dark inverse "Сделать" button. */
function HeroNextTask({
  task,
  sphere,
  onEdit,
}: {
  task: Task;
  sphere: Sphere | null;
  onEdit: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const months = useMonths();
  const weekdaysShort = useWeekdaysShort();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [, startTransition] = useTransition();
  const overdue = !!(task.due_date && isPast(task.due_date));
  const color = sphere?.color ?? "var(--mint)";
  const sphereName = sphere?.name ?? "";

  function handleComplete() {
    setOptimisticDone(true);
    feedbackTaskComplete();
    snack(`${t("tasks.completed_snack")} · ${task.title}`, { taskId: task.id });
    startTransition(async () => {
      try {
        await completeTask(task.id);
      } catch {
        setOptimisticDone(false);
      }
    });
  }

  /* When the user taps "Сделать" the card collapses with a real spring:
     puffs up briefly, then implodes while the surrounding gap contracts
     so the next task slides up cleanly. The outer wrapper carries the
     keyframe animation; the inner card carries colour + content. */
  return (
    <div
      className={optimisticDone ? "hero-collapse" : undefined}
      style={{
        maxHeight: 600,
        overflow: "hidden",
        transformOrigin: "top center",
      }}
    >
    <div
      onClick={onEdit}
      className="hero-fade-in"
      style={{
        background: color,
        color: "var(--ink)",
        borderRadius: 28,
        padding: "18px 20px 20px",
        boxShadow: "var(--shadow-card-lg)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {sphere && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -22,
            top: -22,
            opacity: 0.14,
            pointerEvents: "none",
          }}
        >
          <SphereIcon
            name={sphere.name}
            emoji={sphere.emoji}
            size={120}
            stroke="var(--ink)"
            strokeWidth={1.3}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          position: "relative",
        }}
      >
        {sphereName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "rgba(255,255,255,0.85)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-strong)",
              letterSpacing: "-0.005em",
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            }}
          >
            <SphereIcon
              name={sphereName}
              emoji={sphere?.emoji}
              size={11}
              stroke="var(--ink)"
              strokeWidth={2.2}
            />
            {sphereName}
          </div>
        )}
        <div
          className="tnum"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink-strong)",
            letterSpacing: "-0.005em",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.75)",
            borderRadius: 999,
          }}
        >
          {formatDue(task.due_date, overdue, lang, months, weekdaysShort)}
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-emphasis)",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "var(--ink-strong)",
          position: "relative",
        }}
      >
        {task.title}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="tap"
          style={{
            flex: 1,
            padding: "15px 0",
            borderRadius: 999,
            background: "var(--ink-strong)",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icons.Check size={15} stroke={color} strokeWidth={2.6} />
          {t("today.do_it")}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Открыть"
          className="tap"
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: "rgba(255,255,255,0.35)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icons.Calendar size={18} stroke="var(--ink)" strokeWidth={2} />
        </button>
      </div>
    </div>
    </div>
  );
}

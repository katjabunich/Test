"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Icons, SphereIcon } from "@/components/Icons";
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
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink-60)",
  letterSpacing: "-0.005em",
} as const;

/** Section heading used between groups on Today/Tasks/Settings/Habits. */
const sectionHeadingStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-80)",
  letterSpacing: "-0.005em",
} as const;

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

  const heroTask = sortedTodayTasks[0] ?? null;
  const restTasks = sortedTodayTasks.slice(1);
  const overdueCount = sortedTodayTasks.filter(
    (t) => t.due_date && isPast(t.due_date),
  ).length;
  const heroSphere = heroTask?.sphere_id
    ? sphereById.get(heroTask.sphere_id) ?? null
    : null;

  function weekDoneFor(habitId: string): number {
    const logged = logsByHabit.get(habitId);
    if (!logged) return 0;
    let n = 0;
    for (let i = 0; i < 7; i++) {
      if (logged.has(addDays(todayIso, -i))) n++;
    }
    return n;
  }

  /* Week strip: Mon-Sun of the current calendar week with a per-day count
     of dated tasks. At-a-glance preview of the week's silhouette before
     the hero card narrows the focus to a single next-task. */
  const weekStripDays = useMemo(() => {
    const allOpen = [...todayTasks, ...upcomingTasks];
    const dow = fromIsoDate(todayIso).getDay();
    const offset = dow === 0 ? 6 : dow - 1;
    const monday = addDays(todayIso, -offset);
    return Array.from({ length: 7 }).map((_, i) => {
      const iso = addDays(monday, i);
      const count = allOpen.filter((t) => t.due_date === iso).length;
      return {
        iso,
        date: fromIsoDate(iso),
        count,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
      };
    });
  }, [todayTasks, upcomingTasks, todayIso]);

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
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.04,
                color: "var(--ink)",
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

        {/* Week strip — Mon-Sun preview with task counts per day. */}
        <WeekStrip days={weekStripDays} weekdays={weekdaysShort} />

        {/* Hero "next task" + the rest */}
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {heroTask ? (
            <HeroNextTask
              key={heroTask.id}
              task={heroTask}
              sphere={heroSphere}
              onEdit={() => {
                setEditing(heroTask);
                setModalOpen(true);
              }}
            />
          ) : (
            <div
              style={{
                background: "var(--paper-warm)",
                border: "1px solid var(--ink-05)",
                borderRadius: 22,
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

          {(restTasks.length > 0 || overdueCount > 0) && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 4px 0",
              }}
            >
              <span style={sectionHeadingStyle}>
                {t("today.h_next")} · <span className="tnum">{restTasks.length}</span>
              </span>
              {overdueCount > 0 && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--alert)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    letterSpacing: "-0.005em",
                  }}
                >
                  <Icons.Alert
                    size={12}
                    stroke="var(--alert)"
                    strokeWidth={2.2}
                  />
                  <span className="tnum">{overdueCount}</span>{" "}
                  {t("today.overdue_count")}
                </span>
              )}
            </div>
          )}

          {restTasks.map((task) => (
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

          {upcomingTasks.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 4px 0",
              }}
            >
              <span style={sectionHeadingStyle}>
                {t("today.h_week_short")} · <span className="tnum">{upcomingTasks.length}</span>
              </span>
            </div>
          )}
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

/** Mon-Sun preview strip showing dated open tasks per weekday. Pure
    visualization for now — tap-to-jump can layer on later. */
function WeekStrip({
  days,
  weekdays,
}: {
  days: { iso: string; date: Date; count: number; isToday: boolean; isPast: boolean }[];
  weekdays: readonly string[];
}) {
  return (
    <div style={{ padding: "0 18px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {days.map((d) => {
          const dayLabel = weekdays[d.date.getDay()];
          return (
            <div
              key={d.iso}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "8px 0 10px",
                borderRadius: 12,
                background: d.isToday ? "var(--paper-warm)" : "transparent",
                opacity: d.isPast && !d.isToday ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: d.isToday ? "var(--ink)" : "var(--ink-40)",
                }}
              >
                {dayLabel}
              </span>
              <span
                className="tnum"
                style={{
                  fontFamily: d.isToday ? "var(--font-emphasis)" : "inherit",
                  fontSize: d.isToday ? 18 : 15,
                  fontWeight: d.isToday ? 700 : 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                {d.date.getDate()}
              </span>
              <div
                aria-hidden
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  height: 6,
                }}
              >
                {d.count === 0 ? (
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 2,
                      background: "var(--ink-10)",
                    }}
                  />
                ) : (
                  Array.from({ length: Math.min(d.count, 4) }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        background: d.isToday ? "var(--mint-deep)" : "var(--ink-40)",
                      }}
                    />
                  ))
                )}
                {d.count > 4 && (
                  <span
                    className="tnum"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: d.isToday ? "var(--mint-deep)" : "var(--ink-40)",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    +{d.count - 4}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
    startTransition(async () => {
      try {
        await completeTask(task.id);
      } catch {
        setOptimisticDone(false);
      }
    });
  }

  /* When the user taps "Сделать" the card collapses: scale, fade and
     fold its height down to zero so the next task slides up into its
     place after the server revalidates. The outer wrapper does the
     collapse; the inner card carries the colour + content. */
  return (
    <div
      style={{
        maxHeight: optimisticDone ? 0 : 600,
        opacity: optimisticDone ? 0 : 1,
        transform: optimisticDone ? "scale(0.96)" : "scale(1)",
        transformOrigin: "top center",
        marginBottom: optimisticDone ? -10 : 0,
        overflow: "hidden",
        transition:
          "max-height 380ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 280ms var(--ease-out), transform 380ms var(--ease-out), margin-bottom 380ms var(--ease-out)",
        pointerEvents: optimisticDone ? "none" : "auto",
      }}
    >
    <div
      onClick={onEdit}
      className="hero-fade-in"
      style={{
        background: color,
        color: "var(--ink)",
        borderRadius: 22,
        padding: "16px 18px 18px",
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
            right: -16,
            bottom: -16,
            opacity: 0.14,
            pointerEvents: "none",
          }}
        >
          <SphereIcon
            name={sphere.name}
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
              padding: "4px 10px",
              background: "rgba(255,255,255,0.35)",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.005em",
            }}
          >
            <SphereIcon
              name={sphereName}
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
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
          }}
        >
          {formatDue(task.due_date, overdue, lang, months, weekdaysShort)}
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-emphasis)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.18,
          color: "var(--ink)",
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
            padding: "12px 0",
            borderRadius: 12,
            background: "var(--ink)",
            color,
            border: "none",
            cursor: "pointer",
            fontSize: 14.5,
            fontWeight: 600,
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
            borderRadius: 12,
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

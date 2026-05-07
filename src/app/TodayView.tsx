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

const NAME_KEY = "dela.name";

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAY_LONG = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];
const WEEKDAY_SHORT_LOWER = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

const GREETINGS = {
  morning: ["Доброе утро", "С добрым утром", "Утречко", "Доброго утра"],
  day:     ["Добрый день", "Хорошего дня", "Привет"],
  evening: ["Добрый вечер", "Вечер добрый", "Хорошего вечера"],
  night:   ["Доброй ночи", "Уже поздно", "Тихой ночи"],
};

function pickGreeting(seed: string): string {
  const h = new Date().getHours();
  const pool =
    h < 5 ? GREETINGS.night :
    h < 12 ? GREETINGS.morning :
    h < 18 ? GREETINGS.day :
    GREETINGS.evening;
  // Stable per day: hash today's date so the user sees the same phrase
  // throughout the day, but different from yesterday.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}

function formatDue(due: string | null, overdue: boolean): string {
  if (!due) return "сегодня";
  if (isToday(due)) return "сегодня";
  if (overdue) return "вчера";
  const d = fromIsoDate(due);
  return `${WEEKDAY_SHORT_LOWER[d.getDay()]} · ${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
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
}: {
  todayTasks: Task[];
  upcomingTasks: Task[];
  spheres: Sphere[];
  habits: Habit[];
  logs: HabitLog[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Display name lives in localStorage. Inline-editable in the greeting;
  // listening to the storage event keeps it in sync if multiple tabs are
  // open or another component (Settings) updates it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem(NAME_KEY));
    const onStorage = (e: StorageEvent) => {
      if (e.key === NAME_KEY) setName(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  function startNameEdit() {
    setNameDraft(name ?? "");
    setEditingName(true);
  }
  function commitName() {
    const trimmed = nameDraft.trim().slice(0, 30);
    if (typeof window !== "undefined") {
      if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
      else localStorage.removeItem(NAME_KEY);
    }
    setName(trimmed || null);
    setEditingName(false);
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

  const t = today();
  const dateObj = fromIsoDate(t);
  const habitsToday = habits.filter((h) => isScheduledOn(h, t));
  const logsByHabit = useMemo(() => groupLogsByHabit(logs), [logs]);

  const doneTodaySet = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => {
      if (l.date === t) s.add(l.habit_id);
    });
    return s;
  }, [logs, t]);

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
      if (logged.has(addDays(t, -i))) n++;
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
              {WEEKDAY_LONG[dateObj.getDay()]},{" "}
              <span className="tnum">{dateObj.getDate()}</span>{" "}
              {MONTHS_GENITIVE[dateObj.getMonth()]}
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.036em",
                lineHeight: 1,
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
                  placeholder="имя"
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
                  {name ?? "представься"}
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

        {/* Hero "next task" + the rest */}
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {heroTask ? (
            <HeroNextTask
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
                padding: "28px 18px 32px",
                textAlign: "center",
                color: "var(--ink-60)",
                fontSize: 14.5,
                lineHeight: 1.5,
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                style={{ display: "block", margin: "0 auto 12px" }}
                aria-hidden
              >
                <defs>
                  <radialGradient id="empty-sun" cx="0.5" cy="0.45" r="0.55">
                    <stop offset="0%" stopColor="#fffaf2" />
                    <stop offset="60%" stopColor="#fff0c8" />
                    <stop offset="100%" stopColor="#f5c563" />
                  </radialGradient>
                </defs>
                <circle cx="32" cy="22" r="14" fill="url(#empty-sun)" />
                <path
                  d="M 14 46 L 19 51 L 27 42"
                  stroke="var(--mint-deep)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <rect
                  x="32"
                  y="46"
                  width="20"
                  height="2"
                  rx="1"
                  fill="var(--ink-40)"
                />
              </svg>
              Чисто. Можно отдыхать или добавить дело — кнопка плюса внизу.
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
                Дальше · <span className="tnum">{restTasks.length}</span>
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
                  {overdueCount === 1 ? "просрочена" : "просрочено"}
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
                На неделе · <span className="tnum">{upcomingTasks.length}</span>
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
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [, startTransition] = useTransition();
  const overdue = !!(task.due_date && isPast(task.due_date));
  const color = sphere?.color ?? "var(--mint)";
  const sphereName = sphere?.name ?? "";

  function handleComplete() {
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
      onClick={onEdit}
      style={{
        background: color,
        color: "var(--ink)",
        borderRadius: 22,
        padding: "16px 18px 18px",
        position: "relative",
        overflow: "hidden",
        opacity: optimisticDone ? 0.4 : 1,
        transition: "opacity 280ms var(--ease-out)",
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
          {formatDue(task.due_date, overdue)}
        </div>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.027em",
          lineHeight: 1.15,
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
          Сделать
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
  );
}

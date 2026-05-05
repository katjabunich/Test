"use client";

import { useMemo, useState } from "react";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import Fab from "@/components/Fab";
import { addDays, fromIsoDate, isPast, isToday, today } from "@/lib/date";
import { computeStreak, groupLogsByHabit, isScheduledOn } from "@/lib/habits";

const MONTH_GENITIVE_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAY_LONG_RU = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];
const WEEKDAY_SHORT_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function greetingFor(): string {
  const h = new Date().getHours();
  if (h < 5)  return "доброй ночи";
  if (h < 12) return "доброе утро";
  if (h < 18) return "добрый день";
  return "добрый вечер";
}

function plur(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

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

  const habitDoneCount = habitsToday.filter((h) => doneTodaySet.has(h.id)).length;

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

  const todayCount = sortedTodayTasks.length;
  const habitTotal = habitsToday.length;

  // Combined progress for the hero coin ring.
  const totalToDo = todayCount + habitTotal;
  const totalDone = habitDoneCount; // tasks completed today are filtered out by the query
  const progress = totalToDo > 0 ? Math.min(1, totalDone / totalToDo) : 0;

  const upcomingByDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    upcomingTasks.forEach((task) => {
      if (!task.due_date) return;
      const arr = m.get(task.due_date) ?? [];
      arr.push(task);
      m.set(task.due_date, arr);
    });
    return m;
  }, [upcomingTasks]);

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(t, i + 1));

  return (
    <div style={{ padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* HERO CARD */}
      <div
        className="card"
        style={{
          padding: "22px 22px 20px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {WEEKDAY_LONG_RU[dateObj.getDay()]}, <span className="tnum">{dateObj.getDate()}</span> {MONTH_GENITIVE_RU[dateObj.getMonth()]}
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              color: "var(--text-display)",
              margin: 0,
            }}
          >
            {greetingFor()}
          </h1>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <span>
              {todayCount > 0 ? (
                <>
                  <span className="tnum" style={{ color: "var(--text)", fontWeight: 600 }}>{todayCount}</span>{" "}
                  {plur(todayCount, ["задача", "задачи", "задач"])}
                </>
              ) : (
                "задач нет"
              )}
            </span>
            {habitTotal > 0 && (
              <>
                <span style={{ color: "var(--text-faint)" }}>·</span>
                <span>
                  <span className="tnum" style={{ color: "var(--text)", fontWeight: 600 }}>
                    {habitDoneCount}/{habitTotal}
                  </span>{" "}
                  привычек
                </span>
              </>
            )}
          </div>
        </div>

        {/* Coin / progress ring — jeton's signature disk motif */}
        <ProgressCoin progress={progress} number={dateObj.getDate()} />
      </div>

      {/* HABITS CARD */}
      {habitsToday.length > 0 && (
        <div className="card" style={{ padding: "18px 14px" }}>
          <div className="label" style={{ padding: "0 8px", marginBottom: 12 }}>
            привычки сегодня
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "0 8px",
              scrollbarWidth: "none",
            }}
          >
            {habitsToday.map((h) => (
              <HabitRing
                key={h.id}
                habit={h}
                doneToday={doneTodaySet.has(h.id)}
                streak={computeStreak(h, logsByHabit.get(h.id) ?? new Set())}
              />
            ))}
          </div>
        </div>
      )}

      {/* TODAY CARD */}
      <div className="card" style={{ padding: "18px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "0 16px",
            marginBottom: 10,
          }}
        >
          <span className="label">сегодня</span>
          {todayCount > 0 && (
            <span className="tnum eyebrow">{todayCount}</span>
          )}
        </div>
        {sortedTodayTasks.length === 0 ? (
          <div
            style={{
              padding: "22px 22px 12px",
              color: "var(--text-muted)",
              fontSize: 14.5,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Чисто. Можно отдыхать или добавить дело.
          </div>
        ) : (
          <div>
            {sortedTodayTasks.map((task, i) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  sphere={task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null}
                  onEdit={(t) => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                />
                {i < sortedTodayTasks.length - 1 && (
                  <div style={{ height: 1, background: "var(--hairline-soft)", margin: "0 22px" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WEEK CARD */}
      {upcomingTasks.length > 0 && (
        <div className="card" style={{ padding: "18px 16px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span className="label">на неделе</span>
            <span className="tnum eyebrow">{upcomingTasks.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {weekDays.map((day) => {
              const count = upcomingByDate.get(day)?.length ?? 0;
              const d = fromIsoDate(day);
              return (
                <div
                  key={day}
                  style={{
                    background: count > 0 ? "var(--accent-cream)" : "var(--surface-tint)",
                    border: count > 0 ? "1px solid var(--accent-soft)" : "1px solid var(--hairline-soft)",
                    borderRadius: 14,
                    padding: "10px 4px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-faint)",
                      textTransform: "uppercase",
                      letterSpacing: 0.1,
                      fontWeight: 600,
                    }}
                  >
                    {WEEKDAY_SHORT_RU[d.getDay()]}
                  </div>
                  <div
                    className="tnum"
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginTop: 2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {d.getDate()}
                  </div>
                  <div
                    className="tnum"
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: count > 0 ? "var(--accent-deep)" : "var(--text-faint)",
                      fontWeight: count > 0 ? 600 : 400,
                    }}
                  >
                    {count > 0 ? count : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Fab
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />
      <TaskEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        spheres={spheres}
      />
    </div>
  );
}

/** Disk-shaped progress indicator — jeton's "coin" metaphor adapted. */
function ProgressCoin({ progress, number }: { progress: number; number: number }) {
  const size = 64;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - progress);
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14CAC4" />
            <stop offset="100%" stopColor="#07918D" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="var(--accent-cream)"
          stroke="var(--accent-soft)"
          strokeWidth="1.2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#coinGrad)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--accent-deep)",
          letterSpacing: "-0.02em",
        }}
        className="tnum"
      >
        {number}
      </div>
    </div>
  );
}

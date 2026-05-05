"use client";

import { useMemo, useState } from "react";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import Fab from "@/components/Fab";
import { addDays, fromIsoDate, isPast, isToday, today } from "@/lib/date";
import { computeStreak, groupLogsByHabit, isScheduledOn } from "@/lib/habits";

const WEEKDAY_LONG_RU = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const MONTH_GENITIVE_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const WEEKDAY_SHORT_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function greetingFor(): string {
  const h = new Date().getHours();
  if (h < 5)  return "доброй ночи";
  if (h < 12) return "доброе утро";
  if (h < 18) return "добрый день";
  return "добрый вечер";
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
  const [weekOpen, setWeekOpen] = useState(false);

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

  // Sort: overdue → today → do_today (no-date) → others
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
  const overdueCount = sortedTodayTasks.filter((t) => t.due_date && isPast(t.due_date)).length;

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
    <div style={{ padding: "26px 18px 16px" }}>
      {/* Hero header */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          padding: "0 4px",
          marginBottom: 22,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            {WEEKDAY_LONG_RU[dateObj.getDay()]}
          </div>
          <h1 className="heading-display">{greetingFor()}</h1>
          <div style={{ display: "flex", gap: 14, marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>
            {todayCount > 0 ? (
              <span>
                <strong className="tnum" style={{ color: "var(--text)", fontWeight: 600 }}>{todayCount}</strong>{" "}
                {plur(todayCount, ["задача", "задачи", "задач"])}
                {overdueCount > 0 && (
                  <span style={{ color: "var(--warn)" }}>
                    {" · "}
                    <span className="tnum" style={{ fontWeight: 600 }}>{overdueCount}</span> просрочка
                  </span>
                )}
              </span>
            ) : (
              <span>задач на сегодня нет</span>
            )}
            {habitsToday.length > 0 && (
              <span>
                <strong className="tnum" style={{ color: "var(--text)", fontWeight: 600 }}>
                  {habitDoneCount}/{habitsToday.length}
                </strong>{" "}
                привычек
              </span>
            )}
          </div>
        </div>
        <div
          aria-hidden
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            paddingTop: 2,
          }}
        >
          <span
            className="tnum"
            style={{
              fontSize: 64,
              fontWeight: 200,
              lineHeight: 0.9,
              color: "var(--text-display)",
              letterSpacing: "-0.05em",
            }}
          >
            {dateObj.getDate()}
          </span>
          <span
            style={{
              marginTop: 2,
              fontSize: 12,
              color: "var(--text-muted)",
              letterSpacing: 0.05,
            }}
          >
            {MONTH_GENITIVE_RU[dateObj.getMonth()]}
          </span>
        </div>
      </header>

      {/* Habits row */}
      {habitsToday.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <div className="label" style={{ margin: "0 8px 10px" }}>
            привычки сегодня
          </div>
          <div className="glass" style={{ padding: "16px 6px" }}>
            <div className="stagger" style={{ display: "flex", gap: 4, overflowX: "auto", padding: "0 8px" }}>
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
        </section>
      )}

      {/* Today list */}
      <section style={{ marginBottom: 22 }}>
        <div className="label" style={{ margin: "0 8px 10px" }}>
          сегодня
        </div>
        {sortedTodayTasks.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14.5,
              lineHeight: 1.5,
            }}
          >
            Чисто. Можно отдыхать или добавить дело.
          </div>
        ) : (
          <div className="glass" style={{ padding: 4 }}>
            <div className="stagger">
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
                    <div style={{ height: 1, background: "var(--hairline)", margin: "0 14px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Week preview */}
      {upcomingTasks.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setWeekOpen(!weekOpen)}
            className="tap"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              padding: "0 8px",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <span className="label">на неделе · {upcomingTasks.length}</span>
            <span
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                transform: weekOpen ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 280ms var(--ease-out)",
              }}
            >
              ⌄
            </span>
          </button>
          {/* Always-visible day strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 6,
              marginTop: 10,
            }}
          >
            {weekDays.map((day) => {
              const count = upcomingByDate.get(day)?.length ?? 0;
              const d = fromIsoDate(day);
              return (
                <div
                  key={day}
                  className="glass-soft"
                  style={{
                    padding: "10px 4px",
                    textAlign: "center",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.08 }}>
                    {WEEKDAY_SHORT_RU[d.getDay()]}
                  </div>
                  <div className="tnum" style={{ fontSize: 17, fontWeight: 500, color: "var(--text)", marginTop: 1 }}>
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
          {weekOpen && (
            <div className="glass" style={{ padding: 8, marginTop: 12 }}>
              {weekDays.map((day, idx) => {
                const dayTasks = upcomingByDate.get(day) ?? [];
                if (dayTasks.length === 0) return null;
                const d = fromIsoDate(day);
                return (
                  <div key={day} style={{ padding: "8px 6px" }}>
                    <div className="label" style={{ marginBottom: 4 }}>
                      {WEEKDAY_SHORT_RU[d.getDay()]} · {d.getDate()}
                    </div>
                    {dayTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        sphere={task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null}
                        onEdit={(t) => {
                          setEditing(t);
                          setModalOpen(true);
                        }}
                      />
                    ))}
                    {idx < weekDays.length - 1 && (
                      <div style={{ height: 1, background: "var(--hairline)", margin: "8px 6px 0" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
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

function plur(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

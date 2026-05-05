"use client";

import { useMemo, useState } from "react";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";
import HabitRing from "@/components/HabitRing";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import Fab from "@/components/Fab";
import { addDays, formatDateRu, fromIsoDate, isPast, isToday, today } from "@/lib/date";
import { isScheduledOn } from "@/lib/habits";

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
  const habitsToday = habits.filter((h) => isScheduledOn(h, t));
  const doneTodaySet = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => {
      if (l.date === t) s.add(l.habit_id);
    });
    return s;
  }, [logs, t]);

  // Sort today's tasks: overdue first, then today, then do_today no-date.
  const sortedTodayTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      const aOver = a.due_date ? isPast(a.due_date) ? 0 : isToday(a.due_date) ? 1 : 2 : 2;
      const bOver = b.due_date ? isPast(b.due_date) ? 0 : isToday(b.due_date) ? 1 : 2 : 2;
      if (aOver !== bOver) return aOver - bOver;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      return 0;
    });
  }, [todayTasks]);

  // Week preview: group upcoming by date.
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
    <div style={{ padding: "20px 16px 16px" }}>
      {/* Header */}
      <header style={{ marginBottom: 24, padding: "0 4px" }}>
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            opacity: 0.7,
          }}
        >
          {formatDateRu(t)}
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "6px 0 0",
            color: "var(--text)",
          }}
        >
          {greetingFor()}
        </h1>
      </header>

      {/* Habits row */}
      {habitsToday.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <SectionLabel>Привычки</SectionLabel>
          <div className="glass" style={{ padding: "14px 4px", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                gap: 4,
                overflowX: "auto",
                padding: "0 8px",
              }}
            >
              {habitsToday.map((h) => (
                <HabitRing
                  key={h.id}
                  habit={h}
                  doneToday={doneTodaySet.has(h.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Today's tasks */}
      <section style={{ marginBottom: 20 }}>
        <SectionLabel>Сегодня</SectionLabel>
        <div style={{ marginTop: 8 }}>
          {sortedTodayTasks.length === 0 ? (
            <div
              className="glass"
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 15,
              }}
            >
              На сегодня пусто. Можно отдыхать или добавить дело.
            </div>
          ) : (
            <div className="glass" style={{ padding: 4 }}>
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
          )}
        </div>
      </section>

      {/* Week preview */}
      {upcomingTasks.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setWeekOpen(!weekOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              padding: "0 4px",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <SectionLabel>На неделе · {upcomingTasks.length}</SectionLabel>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                transform: weekOpen ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 200ms ease",
              }}
            >
              ▾
            </span>
          </button>
          {weekOpen && (
            <div className="glass" style={{ padding: 8, marginTop: 8 }}>
              {weekDays.map((day, idx) => {
                const dayTasks = upcomingByDate.get(day) ?? [];
                if (dayTasks.length === 0) return null;
                const d = fromIsoDate(day);
                const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][d.getDay()];
                return (
                  <div key={day} style={{ padding: "6px 6px 8px" }}>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--text-muted)",
                        opacity: 0.7,
                        marginBottom: 4,
                      }}
                    >
                      {wd} · {d.getDate()}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        opacity: 0.7,
        margin: "0 8px",
      }}
    >
      {children}
    </div>
  );
}

function greetingFor(): string {
  const h = new Date().getHours();
  if (h < 5) return "доброй ночи";
  if (h < 12) return "доброе утро";
  if (h < 18) return "добрый день";
  return "добрый вечер";
}

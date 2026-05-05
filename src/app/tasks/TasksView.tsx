"use client";

import { useMemo, useState } from "react";
import type { Sphere, Task } from "@/lib/data";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import Fab from "@/components/Fab";
import { isPast, isToday, today, addDays } from "@/lib/date";

type Group = {
  key: string;
  label: string;
  tone: "warn" | "muted";
  tasks: Task[];
};

function groupTasks(tasks: Task[]): Group[] {
  const overdue: Task[] = [];
  const todays: Task[] = [];
  const week: Task[] = [];
  const later: Task[] = [];
  const noDate: Task[] = [];

  const t = today();
  const weekEnd = addDays(t, 7);

  for (const task of tasks) {
    if (task.do_today && !task.due_date) { todays.push(task); continue; }
    if (!task.due_date) { noDate.push(task); continue; }
    if (isPast(task.due_date)) overdue.push(task);
    else if (isToday(task.due_date)) todays.push(task);
    else if (task.due_date <= weekEnd) week.push(task);
    else later.push(task);
  }

  const groups: Group[] = [];
  if (overdue.length) groups.push({ key: "overdue", label: "Просроченные", tone: "warn", tasks: overdue });
  if (todays.length)  groups.push({ key: "today", label: "Сегодня", tone: "muted", tasks: todays });
  if (week.length)    groups.push({ key: "week", label: "На этой неделе", tone: "muted", tasks: week });
  if (later.length)   groups.push({ key: "later", label: "Позже", tone: "muted", tasks: later });
  if (noDate.length)  groups.push({ key: "nodate", label: "Без даты", tone: "muted", tasks: noDate });
  return groups;
}

export default function TasksView({ tasks, spheres }: { tasks: Task[]; spheres: Sphere[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return tasks;
    return tasks.filter((t) => t.sphere_id === filter);
  }, [tasks, filter]);

  const groups = useMemo(() => groupTasks(filtered), [filtered]);

  const sphereById = useMemo(() => {
    const m = new Map<string, Sphere>();
    spheres.forEach((s) => m.set(s.id, s));
    return m;
  }, [spheres]);

  return (
    <div style={{ padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hero card */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>задачи</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
            color: "var(--text-display)",
            lineHeight: 1.1,
          }}
        >
          <span className="tnum">{tasks.length}</span>{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            {tasks.length === 0 ? "пока нет" : "всего"}
          </span>
        </h1>
      </div>

      {/* Sphere filter card */}
      <div className="card" style={{ padding: "12px 8px" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "4px 8px",
            scrollbarWidth: "none",
          }}
        >
          <FilterChip
            selected={filter === null}
            onClick={() => setFilter(null)}
            label="Все"
          />
          {spheres.map((s) => (
            <FilterChip
              key={s.id}
              selected={filter === s.id}
              onClick={() => setFilter(s.id)}
              label={s.name}
              color={s.color}
              emoji={s.emoji ?? undefined}
            />
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div
          className="card"
          style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-muted)", fontSize: 14.5 }}
        >
          {filter ? "В этой сфере пусто." : "Пока пусто. Нажми + чтобы добавить."}
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="card" style={{ padding: "16px 6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                padding: "0 16px",
                marginBottom: 8,
              }}
            >
              <span
                className="label"
                style={{ color: g.tone === "warn" ? "var(--warn)" : "var(--text-muted)" }}
              >
                {g.label}
              </span>
              <span className="tnum eyebrow">{g.tasks.length}</span>
            </div>
            {g.tasks.map((task, i) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  sphere={task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null}
                  onEdit={(t) => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                />
                {i < g.tasks.length - 1 && (
                  <div style={{ height: 1, background: "var(--hairline-soft)", margin: "0 22px" }} />
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <Fab onClick={() => { setEditing(null); setModalOpen(true); }} />
      <TaskEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        spheres={spheres}
        defaultSphereId={filter}
      />
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  label,
  color,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  emoji?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 13px",
        borderRadius: 999,
        border: selected
          ? `1.5px solid ${color ?? "var(--accent)"}`
          : "1px solid var(--hairline-soft)",
        background: selected
          ? color
            ? `${color}1A`
            : "var(--accent-cream)"
          : "var(--surface-tint)",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {color && (
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: "50%", background: color }}
        />
      )}
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}

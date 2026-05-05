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
    if (task.do_today && !task.due_date) {
      todays.push(task);
      continue;
    }
    if (!task.due_date) {
      noDate.push(task);
      continue;
    }
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
    <div style={{ padding: "26px 18px 16px" }}>
      <header style={{ marginBottom: 18, padding: "0 4px" }}>
        <div className="label" style={{ marginBottom: 6 }}>задачи</div>
        <h1 className="heading-display">
          <span className="tnum">{tasks.length}</span>{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            всего
          </span>
        </h1>
      </header>

      {/* Sphere filter */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "2px 4px 16px",
          marginLeft: -4,
          marginRight: -4,
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

      {groups.length === 0 ? (
        <div
          className="glass"
          style={{ padding: "48px 22px", textAlign: "center", color: "var(--text-muted)", fontSize: 14.5 }}
        >
          {filter ? "В этой сфере пусто." : "Пока пусто. Нажми + чтобы добавить."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="stagger">
          {groups.map((g) => (
            <section key={g.key}>
              <div
                className="label"
                style={{
                  margin: "0 8px 8px",
                  color: g.tone === "warn" ? "var(--warn)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{g.label}</span>
                <span className="tnum" style={{ opacity: 0.6 }}>{g.tasks.length}</span>
              </div>
              <div className="glass" style={{ padding: 4 }}>
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
                      <div style={{ height: 1, background: "var(--hairline)", margin: "0 14px" }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
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
  const dotColor = color ?? "var(--text-faint)";
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
        border: selected ? `1.5px solid ${color ?? "var(--accent)"}` : "1px solid var(--hairline)",
        background: selected
          ? color
            ? `${color}1F`
            : "var(--accent-tint)"
          : "rgba(255,255,255,0.7)",
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
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
          }}
        />
      )}
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Sphere, Task } from "@/lib/data";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import Fab from "@/components/Fab";
import { SphereChip } from "@/components/SphereChip";
import { isPast, isToday, today, addDays } from "@/lib/date";

type Group = {
  key: string;
  label: string;
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
  if (overdue.length) groups.push({ key: "overdue", label: "Просроченные", tasks: overdue });
  if (todays.length) groups.push({ key: "today", label: "Сегодня", tasks: todays });
  if (week.length) groups.push({ key: "week", label: "На этой неделе", tasks: week });
  if (later.length) groups.push({ key: "later", label: "Позже", tasks: later });
  if (noDate.length) groups.push({ key: "nodate", label: "Без даты", tasks: noDate });
  return groups;
}

export default function TasksView({ tasks, spheres }: { tasks: Task[]; spheres: Sphere[] }) {
  const [filter, setFilter] = useState<string | null>(null); // sphere_id or null=all
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

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setModalOpen(true);
  }

  return (
    <div style={{ padding: "20px 16px 16px" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          margin: "0 0 16px 4px",
        }}
      >
        Все задачи
      </h1>

      {/* Sphere filter */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "2px 4px 12px",
          marginLeft: -4,
          marginRight: -4,
        }}
      >
        <SphereChip sphere={null} selected={filter === null} onClick={() => setFilter(null)} />
        {spheres.map((s) => (
          <SphereChip
            key={s.id}
            sphere={s}
            selected={filter === s.id}
            onClick={() => setFilter(s.id)}
          />
        ))}
      </div>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "var(--text-muted)",
            fontSize: 15,
          }}
        >
          Пока пусто. Нажми + чтобы добавить.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {groups.map((g) => (
            <section key={g.key}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: g.key === "overdue" ? "#C46E5A" : "var(--text-muted)",
                  opacity: 0.75,
                  margin: "0 8px 6px",
                }}
              >
                {g.label} · {g.tasks.length}
              </div>
              <div className="glass" style={{ padding: 4 }}>
                {g.tasks.map((task, i) => (
                  <div key={task.id}>
                    <TaskItem
                      task={task}
                      sphere={task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null}
                      onEdit={openEdit}
                    />
                    {i < g.tasks.length - 1 && (
                      <div
                        style={{
                          height: 1,
                          background: "var(--hairline)",
                          margin: "0 14px",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Fab onClick={openNew} />
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

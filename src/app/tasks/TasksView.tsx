"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Sphere, Task } from "@/lib/data";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Icons, SphereIcon } from "@/components/Icons";
import { isPast, isToday, today, addDays } from "@/lib/date";

type Group = {
  key: string;
  label: string;
  /** Text colour for the group label */
  accent?: string;
  items: Task[];
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
  if (overdue.length) groups.push({ key: "overdue", label: "Просрочено", items: overdue, accent: "var(--alert)" });
  if (todays.length)  groups.push({ key: "today",   label: "Сегодня",        items: todays });
  if (week.length)    groups.push({ key: "week",    label: "На этой неделе", items: week });
  if (later.length)   groups.push({ key: "later",   label: "Позже",          items: later });
  if (noDate.length)  groups.push({ key: "nodate",  label: "Без даты",       items: noDate });
  return groups;
}

export default function TasksView({
  tasks,
  spheres,
}: {
  tasks: Task[];
  spheres: Sphere[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [filter, setFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (search.get("new") === "1") {
      setEditing(null);
      setModalOpen(true);
      router.replace("/tasks", { scroll: false });
    }
  }, [search, router]);

  const filtered = useMemo(() => {
    if (!filter) return tasks;
    return tasks.filter((t) => t.sphere_id === filter);
  }, [tasks, filter]);

  const groups = useMemo(() => groupTasks(filtered), [filtered]);
  const overdueCount = tasks.filter((t) => t.due_date && isPast(t.due_date)).length;

  const sphereById = useMemo(() => {
    const m = new Map<string, Sphere>();
    spheres.forEach((s) => m.set(s.id, s));
    return m;
  }, [spheres]);

  const countBySphere = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.sphere_id) return;
      m.set(t.sphere_id, (m.get(t.sphere_id) ?? 0) + 1);
    });
    return m;
  }, [tasks]);

  return (
    <>
      {/* Heading */}
      <div style={{ padding: "8px 22px 16px" }}>
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
          Задачи
        </h1>
        {tasks.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 8,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            <span style={{ color: "var(--ink-60)" }}>
              <span className="tnum">{tasks.length}</span>{" "}
              {tasks.length === 1 ? "активная" : "активных"}
            </span>
            {overdueCount > 0 && (
              <span style={{ color: "var(--alert)" }}>
                · <span className="tnum">{overdueCount}</span>{" "}
                {overdueCount === 1 ? "просрочена" : "просрочено"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 0 16px 22px",
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        <FilterChip
          label="Все"
          count={tasks.length}
          active={filter === null}
          onClick={() => setFilter(null)}
        />
        {spheres.map((s) => (
          <FilterChip
            key={s.id}
            label={s.name}
            count={countBySphere.get(s.id) ?? 0}
            color={s.color}
            sphereName={s.name}
            active={filter === s.id}
            onClick={() => setFilter(s.id)}
          />
        ))}
        <div style={{ minWidth: 18 }} />
      </div>

      {/* Groups */}
      <div
        style={{
          padding: "0 18px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {groups.length === 0 ? (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14.5,
              background: "var(--paper-warm)",
              border: "1px solid var(--ink-05)",
              borderRadius: 16,
            }}
          >
            {filter ? "В этой сфере пусто." : "Пока пусто. Жми + внизу."}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              {/* Plain text section header — label + count, hairline below */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "0 4px 8px",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink-80)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {g.label}
                </span>
                <span
                  className="tnum"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink-40)",
                    opacity: 0.7,
                  }}
                >
                  · {g.items.length}
                </span>
              </div>
              <div
                style={{
                  height: 1,
                  background: "var(--ink-10)",
                  margin: "0 4px 12px",
                }}
              />
              <div
                style={{ display: "flex", flexDirection: "column", gap: 7 }}
              >
                {g.items.map((task) => (
                  <TaskItem
                    key={task.id}
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <TaskEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        spheres={spheres}
        defaultSphereId={filter}
      />
    </>
  );
}

/** Sphere chips wear their sphere colour as a soft tint (always on, even
   when inactive) so the filter row reads like a colour palette of life
   areas. The "Все" chip stays neutral and inverts on active. */
function FilterChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  sphereName?: string;
  active: boolean;
  onClick: () => void;
}) {
  // Active sphere chip wears its saturated colour. Inactive chips —
  // neutral paper-warm with just a coloured marker dot — so the colour
  // "fires" only inside task cards, not twice in a row above them.
  const bg = color
    ? active
      ? color
      : "var(--paper-warm)"
    : active
    ? "var(--ink)"
    : "var(--paper-warm)";
  const border = color
    ? active
      ? color
      : "var(--ink-05)"
    : active
    ? "var(--ink)"
    : "var(--ink-05)";
  const textColor = color
    ? "var(--ink)"
    : active
    ? "var(--paper)"
    : "var(--ink)";
  const countColor = color
    ? active
      ? "var(--ink)"
      : "var(--ink-40)"
    : active
    ? "var(--paper)"
    : "var(--ink-40)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "7px 12px",
        borderRadius: 10,
        flexShrink: 0,
        background: bg,
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: `1.5px solid ${border}`,
        cursor: "pointer",
      }}
    >
      {color && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            background: active ? "var(--ink)" : color,
            opacity: active ? 0.4 : 1,
          }}
        />
      )}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: textColor,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        className="tnum"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: countColor,
          opacity: 0.7,
        }}
      >
        {count}
      </span>
    </button>
  );
}

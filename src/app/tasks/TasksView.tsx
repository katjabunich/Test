"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Sphere, Task } from "@/lib/data";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { isPast, isToday, today, addDays, fromIsoDate } from "@/lib/date";
import { useT, useWeekdaysShort } from "@/lib/i18n/client";

type Group = {
  key: "overdue" | "today" | "week" | "later" | "nodate";
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
  if (overdue.length) groups.push({ key: "overdue", items: overdue, accent: "var(--alert)" });
  if (todays.length)  groups.push({ key: "today",   items: todays });
  if (week.length)    groups.push({ key: "week",    items: week });
  if (later.length)   groups.push({ key: "later",   items: later });
  if (noDate.length)  groups.push({ key: "nodate",  items: noDate });
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
  const t = useT();
  const weekdaysShort = useWeekdaysShort();
  const [filter, setFilter] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (search.get("new") === "1") {
      setEditing(null);
      setModalOpen(true);
      router.replace("/tasks", { scroll: false });
    }
  }, [search, router]);

  /* Sphere filter narrows by life-area; day filter narrows by due date. */
  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (filter && task.sphere_id !== filter) return false;
      if (dayFilter && task.due_date !== dayFilter) return false;
      return true;
    });
  }, [tasks, filter, dayFilter]);

  /* Week strip: counts respect the active sphere filter so the strip
     mirrors the visible list, not the whole archive. */
  const weekStripDays = useMemo(() => {
    const todayIso = today();
    const dow = fromIsoDate(todayIso).getDay();
    const offset = dow === 0 ? 6 : dow - 1;
    const monday = addDays(todayIso, -offset);
    const sphereScoped = filter
      ? tasks.filter((t) => t.sphere_id === filter)
      : tasks;
    return Array.from({ length: 7 }).map((_, i) => {
      const iso = addDays(monday, i);
      const count = sphereScoped.filter((t) => t.due_date === iso).length;
      return {
        iso,
        date: fromIsoDate(iso),
        count,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
      };
    });
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
            fontFamily: "var(--font-emphasis)",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {t("tasks.title")}
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
            <span style={{ color: "var(--ink-60)" }}>{t("tasks.sub")}</span>
            {overdueCount > 0 && (
              <span style={{ color: "var(--alert)" }}>
                · <span className="tnum">{overdueCount}</span> {t("tasks.h_overdue").toLowerCase()}
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
          label={t("tasks.filter_all")}
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

      {/* Week strip — tap a day to narrow the list to that date. */}
      <WeekStrip
        days={weekStripDays}
        weekdays={weekdaysShort}
        activeIso={dayFilter}
        onPick={(iso) =>
          setDayFilter((prev) => (prev === iso ? null : iso))
        }
      />

      {dayFilter && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 22px 12px",
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {dayFilterLabel(dayFilter)}
          </span>
          <button
            type="button"
            onClick={() => setDayFilter(null)}
            className="tap"
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid var(--ink-10)",
              background: "transparent",
              color: "var(--ink-60)",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              cursor: "pointer",
            }}
          >
            {t("tasks.day_clear")}
          </button>
        </div>
      )}

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
              padding: "28px 22px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14.5,
              lineHeight: 1.5,
              background: "var(--paper-warm)",
              border: "1px solid var(--ink-05)",
              borderRadius: 22,
            }}
          >
            {filter ? (
              t("tasks.empty_filter")
            ) : (
              <>
                {t("tasks.empty")}{" "}
                <span className="mark-butter">{t("tasks.empty_hint")}</span>
              </>
            )}
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
                  {t(`tasks.h_${g.key}`)}
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

/** Mon-Sun preview strip with per-day counts. Tap on a day toggles a
    list-level day-filter; tapping the active day again clears it. */
function WeekStrip({
  days,
  weekdays,
  activeIso,
  onPick,
}: {
  days: { iso: string; date: Date; count: number; isToday: boolean; isPast: boolean }[];
  weekdays: readonly string[];
  activeIso: string | null;
  onPick: (iso: string) => void;
}) {
  return (
    <div style={{ padding: "0 18px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {days.map((d) => {
          const dayLabel = weekdays[d.date.getDay()];
          const isActive = activeIso === d.iso;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onPick(d.iso)}
              className="tap"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "8px 0 10px",
                borderRadius: 12,
                background: isActive
                  ? "var(--ink)"
                  : d.isToday
                  ? "var(--paper-warm)"
                  : "transparent",
                border: isActive ? "1.5px solid var(--ink)" : "none",
                color: isActive ? "var(--paper)" : "var(--ink)",
                opacity: d.isPast && !d.isToday && !isActive ? 0.55 : 1,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: isActive
                    ? "var(--paper)"
                    : d.isToday
                    ? "var(--ink)"
                    : "var(--ink-40)",
                }}
              >
                {dayLabel}
              </span>
              <span
                className="tnum"
                style={{
                  fontFamily: d.isToday || isActive ? "var(--font-emphasis)" : "inherit",
                  fontSize: d.isToday || isActive ? 18 : 15,
                  fontWeight: d.isToday || isActive ? 700 : 500,
                  color: isActive ? "var(--paper)" : "var(--ink)",
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
                      background: isActive ? "rgba(245,237,224,0.4)" : "var(--ink-10)",
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
                        background: isActive
                          ? "var(--paper)"
                          : d.isToday
                          ? "var(--mint-deep)"
                          : "var(--ink-40)",
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
                      color: isActive
                        ? "var(--paper)"
                        : d.isToday
                        ? "var(--mint-deep)"
                        : "var(--ink-40)",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    +{d.count - 4}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** Human-readable summary of which day the day-filter is pinning to. */
function dayFilterLabel(iso: string): string {
  const d = fromIsoDate(iso);
  const todayIso = today();
  if (iso === todayIso) return "Сегодня";
  if (iso === addDays(todayIso, 1)) return "Завтра";
  if (iso === addDays(todayIso, -1)) return "Вчера";
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
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

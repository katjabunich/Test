"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Sphere, Task } from "@/lib/data";
import TaskItem from "@/components/TaskItem";
import TaskEditModal from "@/components/TaskEditModal";
import { Card, ScreenBackdrop, ScreenHeader, SectionLabel } from "@/components/ui";
import { isPast, isToday, today, addDays, fromIsoDate } from "@/lib/date";
import { useT, useLang, useWeekdaysShort } from "@/lib/i18n/client";
import { warmStrong, warmTint } from "@/lib/palette";

type Group = {
  key: "today" | "week" | "later" | "nodate" | "overdue";
  items: Task[];
};

/* Calm-overdue rule (design brief): Сегодня → На неделе → Позже → Без даты,
   and the former «Просрочено» group renamed «Ждут своего часа» goes LAST,
   in a fully neutral (no --alert) style. */
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
  if (todays.length)  groups.push({ key: "today",   items: todays });
  if (week.length)    groups.push({ key: "week",    items: week });
  if (later.length)   groups.push({ key: "later",   items: later });
  if (noDate.length)  groups.push({ key: "nodate",  items: noDate });
  if (overdue.length) groups.push({ key: "overdue", items: overdue });
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
  const lang = useLang();
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
     mirrors the visible list, not the whole archive. Forward-looking —
     today + 6 future days, no past dates (those live on /stats). */
  const weekStripDays = useMemo(() => {
    const todayIso = today();
    const sphereScoped = filter
      ? tasks.filter((t) => t.sphere_id === filter)
      : tasks;
    return Array.from({ length: 7 }).map((_, i) => {
      const iso = addDays(todayIso, i);
      const count = sphereScoped.filter((t) => t.due_date === iso).length;
      return {
        iso,
        date: fromIsoDate(iso),
        count,
        isToday: i === 0,
      };
    });
  }, [tasks, filter]);

  const groups = useMemo(() => groupTasks(filtered), [filtered]);
  /* Derived from the same filtered set the groups render — the header
     count and the group below can never disagree. */
  const overdueCount =
    groups.find((g) => g.key === "overdue")?.items.length ?? 0;

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

  /* Russian verb agreement: 1/21/31… «ждёт», everything else «ждут». */
  const waitingKey =
    overdueCount % 10 === 1 && overdueCount % 100 !== 11
      ? "tasks.sub_waiting_one"
      : "tasks.sub_waiting_many";

  const dayLabel = useMemo(() => {
    if (!dayFilter) return "";
    const todayIso = today();
    if (dayFilter === todayIso) return t("common.today");
    if (dayFilter === addDays(todayIso, 1)) return capitalize(t("common.tomorrow"));
    const d = fromIsoDate(dayFilter);
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
      day: "numeric",
      month: "long",
    }).format(d);
  }, [dayFilter, lang, t]);

  return (
    <>
      {/* isolation: isolate — required stacking context for the z-index -1
         backdrop (see CLAUDE.md trap note / ScreenBackdrop docs). */}
      <div style={{ position: "relative", isolation: "isolate" }}>
      {/* Sand sky — calmer sibling of Today's dawn, from the physical
         top edge, melting into the cream ground with no seam. */}
      <ScreenBackdrop gradient="linear-gradient(180deg, #F4E6D2 0%, #F8F0E4 38%, #FBF7F1 80%)" />

      {/* Heading */}
      <ScreenHeader
        label={t("tasks.sub")}
        style={{ paddingBottom: overdueCount > 0 ? 6 : 18 }}
      >
        {t("tasks.title")}
      </ScreenHeader>
      {overdueCount > 0 && (
        <div
          style={{
            padding: "0 20px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--ink-40)",
            letterSpacing: "-0.005em",
          }}
        >
          <span className="tnum">
            {t(waitingKey, { n: overdueCount })}
          </span>
        </div>
      )}

      {/* Filter chips — one consistent 36px row height, same 8px gap and
         14px bottom rhythm as the week strip below. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 0 14px 20px",
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
        <div style={{ minWidth: 20 }} />
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
            padding: "0 20px 12px",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {dayLabel}
          </span>
          <button
            type="button"
            onClick={() => setDayFilter(null)}
            className="tap"
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              border: "1.5px solid var(--ink-10)",
              background: "#FFFFFF",
              color: "var(--ink-60)",
              fontSize: 12,
              fontWeight: 700,
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
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {groups.length === 0 ? (
          <Card
            style={{
              padding: "28px 22px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14.5,
              fontWeight: 600,
              lineHeight: 1.5,
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
          </Card>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              {/* Plump section label + quiet count. The overdue group wears
                  the calm «Ждут своего часа» title — no alert red anywhere. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "0 4px 10px",
                }}
              >
                <SectionLabel>
                  {g.key === "overdue"
                    ? t("today.waiting_title")
                    : t(`tasks.h_${g.key}`)}
                </SectionLabel>
                <span
                  className="tnum"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--ink-40)",
                    opacity: 0.7,
                  }}
                >
                  {g.items.length}
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
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
      </div>

      <TaskEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        spheres={spheres}
        defaultSphereId={filter}
        defaultDueDate={editing ? null : dayFilter}
      />
    </>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Mon-Sun preview strip with per-day counts. Tap on a day toggles a
    list-level day-filter; tapping the active day again clears it. */
function WeekStrip({
  days,
  weekdays,
  activeIso,
  onPick,
}: {
  days: { iso: string; date: Date; count: number; isToday: boolean }[];
  weekdays: readonly string[];
  activeIso: string | null;
  onPick: (iso: string) => void;
}) {
  return (
    <div style={{ padding: "0 20px 18px" }}>
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
                padding: "10px 0",
                borderRadius: "var(--radius-sm)",
                background: isActive
                  ? "rgba(196,103,63,0.12)"
                  : d.isToday
                  ? "var(--paper-warm)"
                  : "transparent",
                border: "none",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: isActive || d.isToday ? "var(--ink)" : "var(--ink-40)",
                }}
              >
                {dayLabel}
              </span>
              <span
                className="tnum"
                style={{
                  fontFamily:
                    d.isToday || isActive ? "var(--font-display)" : "inherit",
                  fontSize: d.isToday || isActive ? 19 : 15,
                  fontWeight: d.isToday || isActive ? 800 : 600,
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
                      background: isActive ? "var(--ink-20)" : "var(--ink-10)",
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
                          ? "var(--terra)"
                          : d.isToday
                          ? "var(--terra)"
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
                      fontWeight: 700,
                      color: isActive
                        ? "var(--terra)"
                        : d.isToday
                        ? "var(--terra)"
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

/** Sphere chips wear their sphere colour only when active (muted tint);
    inactive chips are quiet white pills with a coloured marker dot, so the
    colour "fires" once — in the active filter and the task cards below. */
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
  /* Active chip: sphere colour warmed and muted to an adult tint (bright
     DB seed colours pass through the warm caramel blend, then washed
     white), ink text; «Все» wears a quiet terra tint. Inactive chip:
     white pill with a hairline border. Text always ink. */
  const activeBg = color ? warmTint(color) : "rgba(196,103,63,0.12)";
  const activeBorder = color ? warmTint(color) : "rgba(196,103,63,0.35)";
  const bg = active ? activeBg : "#FFFFFF";
  const border = active ? activeBorder : "var(--ink-10)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        flexShrink: 0,
        background: bg,
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: `1.5px solid ${border}`,
        cursor: "pointer",
      }}
    >
      {color && !active && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            background: warmStrong(color),
          }}
        />
      )}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-strong)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <span
        className="tnum"
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: active ? "var(--ink)" : "var(--ink-40)",
          opacity: active ? 0.55 : 0.8,
        }}
      >
        {count}
      </span>
    </button>
  );
}

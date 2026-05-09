"use client";

import { useMemo, useState } from "react";
import type { Sphere, Task } from "@/lib/data";
import { useT, useLang, useMonths } from "@/lib/i18n/client";
import { toIsoDate, today as todayIso, addDays } from "@/lib/date";

type Period = "today" | "week" | "month";

const PERIODS: Period[] = ["today", "week", "month"];

const NEUTRAL_SPHERE_COLOR = "rgba(45,38,32,0.22)";
const LIST_CAP = 50;

/** Local-time start-of-day Date offset by `daysAgo` from today. */
function startOfDayLocal(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function periodStart(p: Period): Date {
  if (p === "today") return startOfDayLocal(0);
  if (p === "week") return startOfDayLocal(6); // last 7 days incl. today
  return startOfDayLocal(29); // last 30 days
}

/** Russian count form for "задача / задачи / задач". */
function pluralRu(n: number): "one" | "few" | "many" {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "few";
  return "many";
}

export default function StatsView({
  completed,
  spheres,
}: {
  completed: Task[];
  spheres: Sphere[];
}) {
  const t = useT();
  const lang = useLang();
  const months = useMonths();
  const [period, setPeriod] = useState<Period>("today");

  const sphereById = useMemo(() => {
    const m = new Map<string, Sphere>();
    spheres.forEach((s) => m.set(s.id, s));
    return m;
  }, [spheres]);

  const filtered = useMemo(() => {
    const start = periodStart(period).getTime();
    return completed.filter(
      (c) => c.completed_at && new Date(c.completed_at).getTime() >= start,
    );
  }, [completed, period]);

  /* Sphere breakdown — bucket tasks by sphere_id, missing sphere or
     deleted sphere collapses into a single neutral row. */
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>(); // key: sphere_id or "__none__"
    const NONE = "__none__";
    filtered.forEach((task) => {
      const id = task.sphere_id ?? NONE;
      const sphere = task.sphere_id ? sphereById.get(task.sphere_id) : null;
      const key = sphere ? id : NONE;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const rows = Array.from(counts.entries()).map(([key, count]) => {
      const sphere = key === NONE ? null : sphereById.get(key) ?? null;
      return {
        key,
        name: sphere?.name ?? t("stats.no_sphere"),
        color: sphere?.color ?? NEUTRAL_SPHERE_COLOR,
        count,
      };
    });
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [filtered, sphereById, t]);

  const total = filtered.length;
  const maxCount = Math.max(1, ...breakdown.map((r) => r.count));

  /* Group completed tasks by local-day for the "Что сделано" list. */
  const grouped = useMemo(() => {
    const byDay = new Map<string, Task[]>();
    filtered.forEach((task) => {
      if (!task.completed_at) return;
      const day = toIsoDate(new Date(task.completed_at));
      const list = byDay.get(day) ?? [];
      list.push(task);
      byDay.set(day, list);
    });
    return Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  /* Cap the visible list at LIST_CAP across all groups and remember
     how many tail items got hidden, so we can show a "+N more" footer. */
  const { capped, hiddenCount } = useMemo(() => {
    const out: { day: string; tasks: Task[] }[] = [];
    let remaining = LIST_CAP;
    let hidden = 0;
    for (const [day, tasks] of grouped) {
      if (remaining <= 0) {
        hidden += tasks.length;
        continue;
      }
      const slice = tasks.slice(0, remaining);
      out.push({ day, tasks: slice });
      hidden += tasks.length - slice.length;
      remaining -= slice.length;
    }
    return { capped: out, hiddenCount: hidden };
  }, [grouped]);

  const completedLabel = useMemo(() => {
    if (lang === "ru") {
      const form = pluralRu(total);
      if (form === "one") return t("stats.completed_one");
      if (form === "few") return t("stats.completed_few");
      return t("stats.completed_count");
    }
    return total === 1 ? t("stats.completed_one") : t("stats.completed_count");
  }, [total, lang, t]);

  return (
    <>
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
          {t("stats.title")}
        </h1>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginTop: 8,
            letterSpacing: "-0.005em",
          }}
        >
          {t("stats.sub")}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 22px 18px",
        }}
      >
        {PERIODS.map((p) => (
          <PeriodTab
            key={p}
            label={t(`stats.tab_${p}`)}
            active={period === p}
            onClick={() => setPeriod(p)}
          />
        ))}
      </div>

      {/* Hero — big number + label */}
      <div style={{ padding: "0 18px 22px" }}>
        <div
          style={{
            background: "var(--paper-warm)",
            border: "1px solid var(--ink-05)",
            borderRadius: 22,
            padding: "22px 24px 24px",
          }}
        >
          <div
            className="tnum"
            style={{
              fontFamily: "var(--font-emphasis)",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "var(--ink-strong)",
            }}
          >
            {total}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {completedLabel}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ padding: "0 18px" }}>
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
            {t("stats.empty_pre")}
            <span className="mark-butter">{t("stats.empty_mark")}</span>
            {t("stats.empty_post")}
          </div>
        </div>
      ) : (
        <>
          {/* Sphere breakdown */}
          <div style={{ padding: "0 18px 22px" }}>
            <SectionHeader label={t("stats.section_breakdown")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {breakdown.map((row) => (
                <SphereBar
                  key={row.key}
                  name={row.name}
                  color={row.color}
                  count={row.count}
                  ratio={row.count / maxCount}
                  isNeutral={row.color === NEUTRAL_SPHERE_COLOR}
                />
              ))}
            </div>
          </div>

          {/* Done list */}
          <div style={{ padding: "0 18px" }}>
            <SectionHeader label={t("stats.section_done")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {capped.map(({ day, tasks }) => (
                <div key={day}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-60)",
                      padding: "0 4px 8px",
                      letterSpacing: "-0.005em",
                      textTransform: "uppercase",
                    }}
                  >
                    {dayLabel(day, t, months)}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {tasks.map((task) => (
                      <DoneRow
                        key={task.id}
                        task={task}
                        sphere={
                          task.sphere_id
                            ? sphereById.get(task.sphere_id) ?? null
                            : null
                        }
                        lang={lang}
                        noSphereLabel={t("stats.no_sphere")}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {hiddenCount > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4px 0 8px",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "var(--ink-40)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t("stats.more_count", { n: hiddenCount })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function PeriodTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "7px 14px",
        borderRadius: 10,
        flexShrink: 0,
        background: active ? "var(--ink)" : "var(--paper-warm)",
        color: active ? "var(--paper)" : "var(--ink)",
        border: `1.5px solid ${active ? "var(--ink)" : "var(--ink-05)"}`,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-80)",
          padding: "0 4px 8px",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 1,
          background: "var(--ink-10)",
          margin: "0 4px 12px",
        }}
      />
    </>
  );
}

function SphereBar({
  name,
  color,
  count,
  ratio,
  isNeutral,
}: {
  name: string;
  color: string;
  count: number;
  ratio: number;
  isNeutral: boolean;
}) {
  /* Bar widths floor at ~6% so even single-task spheres render a sliver
     of colour, not an invisible line. */
  const widthPct = Math.max(6, Math.round(ratio * 100));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "var(--paper-warm)",
        border: "1px solid var(--ink-05)",
        borderRadius: 14,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          background: isNeutral ? "var(--ink-40)" : color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 6,
          }}
        >
          {name}
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 6,
            background: "var(--ink-05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${widthPct}%`,
              height: "100%",
              background: isNeutral ? "var(--ink-40)" : color,
              borderRadius: 6,
              transition: "width 320ms var(--ease-out)",
            }}
          />
        </div>
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {count}
      </div>
    </div>
  );
}

function DoneRow({
  task,
  sphere,
  lang,
  noSphereLabel,
}: {
  task: Task;
  sphere: Sphere | null;
  lang: "ru" | "en";
  noSphereLabel: string;
}) {
  const time = task.completed_at ? formatTime(task.completed_at, lang) : "";
  const sphereName = sphere?.name ?? noSphereLabel;
  const sphereColor = sphere?.color ?? NEUTRAL_SPHERE_COLOR;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "var(--paper-warm)",
        border: "1px solid var(--ink-05)",
        borderRadius: 14,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          background: "var(--mint-deep)",
          color: "var(--paper)",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ✓
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3,
            fontSize: 11.5,
            fontWeight: 500,
            color: "var(--ink-60)",
            letterSpacing: "-0.005em",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: sphereColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sphereName}
          </span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span className="tnum">{time}</span>
        </div>
      </div>
    </div>
  );
}

function dayLabel(
  isoDay: string,
  t: ReturnType<typeof useT>,
  months: readonly string[],
): string {
  const today = todayIso();
  if (isoDay === today) return t("common.today");
  if (isoDay === addDays(today, -1)) return t("stats.yesterday");
  const [, m, d] = isoDay.split("-").map(Number);
  const day = d;
  const month = months[m - 1] ?? "";
  return `${day} ${month}`;
}

function formatTime(iso: string, lang: "ru" | "en"): string {
  try {
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

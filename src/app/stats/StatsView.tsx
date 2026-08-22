"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Sphere, Task } from "@/lib/data";
import { Card, ScreenBackdrop, ScreenHeader } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";
import { fromIsoDate, toIsoDate } from "@/lib/date";

type Period = "today" | "week" | "month";

const PERIODS: Period[] = ["today", "week", "month"];

const NEUTRAL_SPHERE_COLOR = "var(--ink-40)";
const BEAD_FALLBACK_THRESHOLD = 50;
const DAY_CARD_PAGINATION = 30;

/* ─────────────────── Date math (local TZ throughout) ─────────────────── */

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday-first week: returns the Monday at 00:00 local of the current week. */
function startOfThisWeekLocal(): Date {
  const d = startOfTodayLocal();
  const dow = d.getDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

function startOfThisMonthLocal(): Date {
  const d = startOfTodayLocal();
  d.setDate(1);
  return d;
}

function addDaysDate(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Range used for the hero count + day cards, per period. End is exclusive
    (next-day midnight). Today and "in-progress week/month" run start→tomorrow. */
function periodRange(p: Period): { start: Date; end: Date } {
  const tomorrow = addDaysDate(startOfTodayLocal(), 1);
  if (p === "today") return { start: startOfTodayLocal(), end: tomorrow };
  if (p === "week") return { start: startOfThisWeekLocal(), end: tomorrow };
  return { start: startOfThisMonthLocal(), end: tomorrow };
}

/** Same-elapsed-time comparison range: previous period covering the same
    number of elapsed days, ending right before the current period starts. */
function prevRangeFor(p: Period): { start: Date; end: Date } {
  const { start, end } = periodRange(p);
  const elapsedMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - elapsedMs);
  return { start: prevStart, end: prevEnd };
}

/** Range that drives the mini-calendar visualisation — fixed per spec.
    Week = full Mon–Sun, Month = full calendar month (with leading blanks). */
function calendarRange(p: Period): { start: Date; end: Date } | null {
  if (p === "today") return null;
  if (p === "week") {
    const start = startOfThisWeekLocal();
    return { start, end: addDaysDate(start, 7) };
  }
  const start = startOfThisMonthLocal();
  const next = new Date(start);
  next.setMonth(next.getMonth() + 1);
  return { start, end: next };
}

/* ─────────────────── Selectors over the raw Task[] ─────────────────── */

function localDayKey(iso: string): string {
  return toIsoDate(new Date(iso));
}

function countInRange(tasks: Task[], r: { start: Date; end: Date }): number {
  const s = r.start.getTime();
  const e = r.end.getTime();
  let n = 0;
  for (const t of tasks) {
    if (!t.completed_at) continue;
    const ts = new Date(t.completed_at).getTime();
    if (ts >= s && ts < e) n++;
  }
  return n;
}

function tasksInRange(
  tasks: Task[],
  r: { start: Date; end: Date },
): Task[] {
  const s = r.start.getTime();
  const e = r.end.getTime();
  return tasks.filter((t) => {
    if (!t.completed_at) return false;
    const ts = new Date(t.completed_at).getTime();
    return ts >= s && ts < e;
  });
}

/* ─────────────────── Roll-up counter hook ─────────────────── */

function useRollUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic-ish
      setValue(Math.round(from + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/* ─────────────────── Editorial empty-day phrases ─────────────────── */

function hashIsoDate(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function emptyDayPhrase(
  isoDay: string,
  t: ReturnType<typeof useT>,
): string {
  const idx = (hashIsoDate(isoDay) % 5) + 1;
  return t(`stats.day_empty${idx}`);
}

/* ─────────────────── Locale-aware date formatting ─────────────────── */

function localeFor(lang: Lang): string {
  return lang === "ru" ? "ru-RU" : "en-GB";
}

function dayCardHeader(isoDay: string, lang: Lang): string {
  const d = fromIsoDate(isoDay);
  const out = new Intl.DateTimeFormat(localeFor(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function formatTime(iso: string, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(localeFor(lang), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function shortWeekdayMon(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), { weekday: "short" })
    .format(d)
    .replace(".", "");
}

/* ─────────────────── Component ─────────────────── */

export default function StatsView({
  completed,
  spheres,
}: {
  completed: Task[];
  spheres: Sphere[];
}) {
  const t = useT();
  const lang = useLang();
  const [period, setPeriod] = useState<Period>("today");

  const sphereById = useMemo(() => {
    const m = new Map<string, Sphere>();
    spheres.forEach((s) => m.set(s.id, s));
    return m;
  }, [spheres]);

  /* Hero counts — current period and previous-period comparison. */
  const range = useMemo(() => periodRange(period), [period]);
  const prevRange = useMemo(() => prevRangeFor(period), [period]);
  const total = useMemo(() => countInRange(completed, range), [completed, range]);
  const prevTotal = useMemo(
    () => countInRange(completed, prevRange),
    [completed, prevRange],
  );
  const animatedTotal = useRollUp(total);

  /* Tasks in the visible (period) range, used by the sphere breakdown
     beads and the day-card list. */
  const periodTasks = useMemo(
    () => tasksInRange(completed, range),
    [completed, range],
  );

  /* Sphere breakdown: every task → one bead. */
  const breakdown = useMemo(() => {
    const NONE = "__none__";
    const buckets = new Map<string, { name: string; color: string; tasks: Task[] }>();
    for (const task of periodTasks) {
      const sphere = task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null;
      const key = sphere ? sphere.id : NONE;
      let row = buckets.get(key);
      if (!row) {
        row = {
          name: sphere?.name ?? t("stats.no_sphere"),
          color: sphere?.color ?? NEUTRAL_SPHERE_COLOR,
          tasks: [],
        };
        buckets.set(key, row);
      }
      row.tasks.push(task);
    }
    return Array.from(buckets.entries())
      .map(([key, v]) => ({ key, ...v, count: v.tasks.length }))
      .sort((a, b) => b.count - a.count);
  }, [periodTasks, sphereById, t]);

  const breakdownMax = Math.max(1, ...breakdown.map((b) => b.count));

  /* Day-card list — every day from range.start to (today inclusive) gets
     a card, even if zero tasks completed. We paginate large month windows. */
  const dayList = useMemo(() => {
    const days: { iso: string; tasks: Task[] }[] = [];
    const today = startOfTodayLocal();
    let cursor = new Date(range.start);
    while (cursor.getTime() <= today.getTime()) {
      const iso = toIsoDate(cursor);
      days.push({ iso, tasks: [] });
      cursor = addDaysDate(cursor, 1);
    }
    const byIso = new Map(days.map((d) => [d.iso, d]));
    for (const task of periodTasks) {
      if (!task.completed_at) continue;
      const key = localDayKey(task.completed_at);
      byIso.get(key)?.tasks.push(task);
    }
    days.reverse();
    days.forEach((d) =>
      d.tasks.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    );
    return days;
  }, [periodTasks, range]);

  const [visibleDays, setVisibleDays] = useState(DAY_CARD_PAGINATION);
  useEffect(() => setVisibleDays(DAY_CARD_PAGINATION), [period]);
  const dayCardsToShow = dayList.slice(0, visibleDays);
  const hasMoreDays = visibleDays < dayList.length;

  /* Mini-calendar data — only built for week/month tabs. */
  const calendarData = useMemo(() => {
    const r = calendarRange(period);
    if (!r) return null;
    const days: { date: Date; iso: string; tasks: Task[]; isFuture: boolean; isToday: boolean }[] = [];
    const today = startOfTodayLocal();
    let cursor = new Date(r.start);
    while (cursor.getTime() < r.end.getTime()) {
      const iso = toIsoDate(cursor);
      days.push({
        date: new Date(cursor),
        iso,
        tasks: [],
        isFuture: cursor.getTime() > today.getTime(),
        isToday: cursor.getTime() === today.getTime(),
      });
      cursor = addDaysDate(cursor, 1);
    }
    const byIso = new Map(days.map((d) => [d.iso, d]));
    for (const task of completed) {
      if (!task.completed_at) continue;
      byIso.get(localDayKey(task.completed_at))?.tasks.push(task);
    }
    return days;
  }, [completed, period]);

  /* Underline-on-tab logic — measure each tab's offset/width and slide
     the underline between them. */
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const idx = PERIODS.indexOf(period);
    const el = tabRefs.current[idx];
    const wrap = tabsContainerRef.current;
    if (!el || !wrap) return;
    const elRect = el.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    setUnderline({
      left: elRect.left - wrapRect.left,
      width: elRect.width,
    });
  }, [period, lang]);

  /* Swipe between tabs. */
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (swipeStartX.current == null || swipeStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 40) return;
    const idx = PERIODS.indexOf(period);
    if (dx < 0 && idx < PERIODS.length - 1) setPeriod(PERIODS[idx + 1]);
    else if (dx > 0 && idx > 0) setPeriod(PERIODS[idx - 1]);
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      /* isolation: isolate — required stacking context for the z-index -1
         backdrop (see CLAUDE.md trap note / ScreenBackdrop docs). */
      style={{ position: "relative", isolation: "isolate" }}
    >
      {/* Caramel-amber sky from the physical top edge, melting into the
         cream ground with no seam. No sun — that stays on Today. */}
      <ScreenBackdrop gradient="linear-gradient(180deg, #F5E7CC 0%, #F9F0DF 38%, #FBF7F1 80%)" />

      {/* Heading */}
      <ScreenHeader style={{ paddingBottom: 14 }}>
        {t("stats.title")}
      </ScreenHeader>

      {/* Hero — big animated count + comparison; 18px bottom keeps the
         hero→tabs rhythm in step with the other screens' blocks. */}
      <div style={{ padding: "0 20px 18px" }}>
        <div
          className="tnum"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            color: "var(--ink-strong)",
          }}
        >
          {animatedTotal}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-60)",
            letterSpacing: "-0.005em",
          }}
        >
          {t(`stats.completed_${period}`)}
        </div>
        <ComparisonLine total={total} prev={prevTotal} period={period} t={t} />
      </div>

      {/* Underline tabs */}
      <div
        ref={tabsContainerRef}
        style={{
          display: "flex",
          gap: 24,
          padding: "0 20px",
          position: "relative",
          marginBottom: 20,
        }}
      >
        {PERIODS.map((p, i) => {
          const active = period === p;
          return (
            <button
              key={p}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              onClick={() => setPeriod(p)}
              className="tap"
              style={{
                padding: "8px 0 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: active ? "var(--ink)" : "var(--ink-40)",
                transition: "color 280ms var(--ease-out)",
              }}
            >
              {t(`stats.tab_${p}`)}
            </button>
          );
        })}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: underline.left,
            width: underline.width,
            height: 2,
            background: "var(--terra)",
            borderRadius: 2,
            transition:
              "left 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 0,
            height: 1,
            background: "var(--ink-10)",
            zIndex: -1,
          }}
        />
      </div>

      {/* Sphere breakdown */}
      {periodTasks.length > 0 && (
        <div
          style={{
            padding: "0 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {breakdown.map((row) => (
            <SphereRow
              key={row.key}
              name={row.name}
              color={row.color}
              count={row.count}
              max={breakdownMax}
              isNeutral={row.color === NEUTRAL_SPHERE_COLOR}
            />
          ))}
        </div>
      )}

      {/* Mini-calendar */}
      {calendarData && periodTasks.length > 0 && (
        <div style={{ padding: "0 20px 26px" }}>
          {period === "week" ? (
            <WeekCalendar days={calendarData} sphereById={sphereById} lang={lang} />
          ) : (
            <MonthCalendar days={calendarData} lang={lang} />
          )}
        </div>
      )}

      {/* Day-card list (or full empty state if hero count == 0) */}
      {periodTasks.length === 0 ? (
        <div style={{ padding: "0 20px 22px" }}>
          <div
            style={{
              padding: "44px 24px",
              textAlign: "center",
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
              color: "var(--ink-60)",
            }}
          >
            {t(`stats.empty_${period}`)}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {dayCardsToShow.map((d, i) => (
            <DayCard
              key={d.iso}
              isoDay={d.iso}
              tasks={d.tasks}
              sphereById={sphereById}
              lang={lang}
              t={t}
              animationDelayMs={Math.min(i * 35, 420)}
            />
          ))}
          {hasMoreDays && (
            <button
              type="button"
              onClick={() => setVisibleDays((v) => v + DAY_CARD_PAGINATION)}
              className="tap"
              style={{
                marginTop: 4,
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px dashed var(--ink-20)",
                background: "transparent",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink-60)",
                letterSpacing: "-0.005em",
                cursor: "pointer",
              }}
            >
              {t("stats.show_more")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Sub-components ─────────────────── */

function ComparisonLine({
  total,
  prev,
  period,
  t,
}: {
  total: number;
  prev: number;
  period: Period;
  t: ReturnType<typeof useT>;
}) {
  if (prev === 0 && total === 0) return null;
  const diff = total - prev;
  let kind: "more" | "less" | "same";
  if (Math.abs(diff) <= 1) kind = "same";
  else if (diff > 0) kind = "more";
  else kind = "less";
  const arrow = kind === "more" ? "↑" : kind === "less" ? "↓" : "~";
  const color =
    kind === "more"
      ? "var(--mint-deep)"
      : kind === "less"
      ? "var(--ink-40)"
      : "var(--ink-40)";
  const label =
    kind === "same"
      ? t(`stats.cmp_same_${period}`)
      : t(`stats.cmp_${kind}_${period}`, { n: Math.abs(diff) });
  return (
    <div
      style={{
        marginTop: 4,
        fontSize: 12.5,
        fontWeight: 500,
        color: "var(--ink-60)",
        letterSpacing: "-0.005em",
      }}
    >
      <span style={{ color, marginRight: 4, fontWeight: 700 }}>{arrow}</span>
      {label}
    </div>
  );
}

function SphereRow({
  name,
  color,
  count,
  max,
  isNeutral,
}: {
  name: string;
  color: string;
  count: number;
  max: number;
  isNeutral: boolean;
}) {
  const fallbackToBar = count > BEAD_FALLBACK_THRESHOLD;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isNeutral ? "var(--ink-40)" : "var(--ink-80)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {name}
        </span>
        <span
          className="tnum"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
          }}
        >
          {count}
        </span>
      </div>
      {fallbackToBar ? (
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: "var(--ink-05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(6, Math.round((count / max) * 100))}%`,
              height: "100%",
              background: isNeutral ? "var(--ink-40)" : color,
              borderRadius: 4,
              transition: "width 320ms var(--ease-out)",
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="bead-in"
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: isNeutral ? "var(--ink-40)" : color,
                animationDelay: `${Math.min(i * 30, 900)}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekCalendar({
  days,
  sphereById,
  lang,
}: {
  days: { date: Date; iso: string; tasks: Task[]; isFuture: boolean; isToday: boolean }[];
  sphereById: Map<string, Sphere>;
  lang: Lang;
}) {
  const maxStack = Math.max(1, ...days.map((d) => d.tasks.length));
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {days.map((d) => (
        <div
          key={d.iso}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: d.isToday ? "var(--ink)" : "var(--ink-40)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {shortWeekdayMon(d.date, lang)}
          </div>
          <div
            style={{
              minHeight: maxStack * 10 + 4,
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              gap: 3,
              opacity: d.isFuture ? 0.35 : 1,
            }}
          >
            {d.tasks.slice(0, 12).map((task, i) => {
              const sphere = task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null;
              return (
                <span
                  key={task.id}
                  aria-hidden
                  className="bead-in"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: sphere?.color ?? NEUTRAL_SPHERE_COLOR,
                    animationDelay: `${Math.min(i * 28, 600)}ms`,
                  }}
                />
              );
            })}
            {d.tasks.length === 0 && (
              <span
                aria-hidden
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--ink-10)",
                }}
              />
            )}
          </div>
          {d.isToday && (
            <div
              aria-hidden
              style={{
                width: 16,
                height: 2,
                borderRadius: 2,
                background: "var(--terra)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MonthCalendar({
  days,
  lang,
}: {
  days: { date: Date; iso: string; tasks: Task[]; isFuture: boolean; isToday: boolean }[];
  lang: Lang;
}) {
  /* Build a 7-column grid starting Monday. The first cell is the Monday on
     or before days[0]; trailing cells continue past month-end up to Sunday. */
  const firstDate = days[0].date;
  const firstDow = firstDate.getDay(); // 0=Sun..6=Sat
  const leading = firstDow === 0 ? 6 : firstDow - 1;
  const lastDate = days[days.length - 1].date;
  const lastDow = lastDate.getDay();
  const trailing = lastDow === 0 ? 0 : 7 - lastDow;
  const cells: ({
    date: Date;
    iso: string;
    tasks: Task[];
    isFuture: boolean;
    isToday: boolean;
  } | null)[] = [
    ...Array(leading).fill(null),
    ...days,
    ...Array(trailing).fill(null),
  ];

  const maxCount = Math.max(1, ...days.map((d) => d.tasks.length));

  /* Warm watercolor interpolation: near-cream → muted butter → muted
     peach. Anchors derived from the dawn tokens in globals.css (--butter
     #E8CD9A, --peach #E8C4A8), starting from a near-cream wash so
     low-activity cells stay quiet on the warm cream page. */
  function cellBackground(count: number): string {
    if (count === 0) return "var(--paper-deep)";
    const ratio = count / maxCount;
    const stops = [
      { r: 247, g: 238, b: 221 }, // butter washed toward cream
      { r: 232, g: 205, b: 154 }, // --butter (dawn)
      { r: 232, g: 196, b: 168 }, // --peach (dawn)
    ];
    const t = Math.min(1, Math.max(0, ratio));
    const seg = t < 0.5 ? 0 : 1;
    const local = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
    const a = stops[seg];
    const b = stops[seg + 1];
    const r = Math.round(a.r + (b.r - a.r) * local);
    const g = Math.round(a.g + (b.g - a.g) * local);
    const bl = Math.round(a.b + (b.b - a.b) * local);
    return `rgb(${r},${g},${bl})`;
  }

  const monday = new Date(firstDate);
  if (leading > 0) monday.setDate(monday.getDate() - leading);
  const headers: string[] = [];
  for (let i = 0; i < 7; i++) {
    headers.push(shortWeekdayMon(addDaysDate(monday, i), lang));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {headers.map((h, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--ink-40)",
              padding: "2px 0",
            }}
          >
            {h}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) {
            return (
              <div
                key={`blank-${i}`}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                }}
              />
            );
          }
          const bg = c.isFuture ? "var(--paper-deep)" : cellBackground(c.tasks.length);
          return (
            <div
              key={c.iso}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: "var(--radius-sm)",
                background: bg,
                opacity: c.isFuture ? 0.55 : 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                padding: "5px 6px",
              }}
            >
              <div
                className="tnum"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  /* Fills are all light pastels now — dark ink stays
                     readable on every step of the gradient. */
                  color: c.tasks.length >= maxCount * 0.5
                    ? "var(--ink-80)"
                    : "var(--ink-60)",
                  letterSpacing: "-0.005em",
                }}
              >
                {c.date.getDate()}
              </div>
              {c.isToday && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--terra)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayCard({
  isoDay,
  tasks,
  sphereById,
  lang,
  t,
  animationDelayMs,
}: {
  isoDay: string;
  tasks: Task[];
  sphereById: Map<string, Sphere>;
  lang: Lang;
  t: ReturnType<typeof useT>;
  animationDelayMs: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Card
      className="day-card-in"
      style={{
        padding: "16px 18px 18px",
        animationDelay: `${animationDelayMs}ms`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: tasks.length > 0 ? 12 : 6,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--ink-strong)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {dayCardHeader(isoDay, lang)}
        </div>
        <div
          className="tnum"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: tasks.length === 0 ? "var(--ink-40)" : "var(--ink)",
          }}
        >
          {tasks.length}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-40)",
            letterSpacing: "-0.005em",
          }}
        >
          {emptyDayPhrase(isoDay, t)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map((task) => (
            <DoneItem
              key={task.id}
              task={task}
              sphere={
                task.sphere_id ? sphereById.get(task.sphere_id) ?? null : null
              }
              lang={lang}
              isOpen={expanded.has(task.id)}
              onToggle={() => toggle(task.id)}
              noSphereLabel={t("stats.no_sphere")}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function DoneItem({
  task,
  sphere,
  lang,
  isOpen,
  onToggle,
  noSphereLabel,
}: {
  task: Task;
  sphere: Sphere | null;
  lang: Lang;
  isOpen: boolean;
  onToggle: () => void;
  noSphereLabel: string;
}) {
  const time = task.completed_at ? formatTime(task.completed_at, lang) : "";
  const sphereName = sphere?.name ?? noSphereLabel;
  const sphereColor = sphere?.color ?? NEUTRAL_SPHERE_COLOR;
  const checkColor = sphere?.color ?? "var(--mint-deep)";
  const hasDetails = !!task.note || !!task.due_date;
  return (
    <button
      type="button"
      onClick={hasDetails ? onToggle : undefined}
      className={hasDetails ? "tap" : undefined}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: hasDetails ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            background: checkColor,
            color: "var(--paper)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          ✓
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
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
              fontSize: 12,
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
      {hasDetails && (
        <div
          style={{
            overflow: "hidden",
            transition:
              "max-height 280ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 220ms var(--ease-out)",
            maxHeight: isOpen ? 200 : 0,
            opacity: isOpen ? 1 : 0,
            marginLeft: 26,
          }}
        >
          {task.note && (
            <div
              style={{
                paddingTop: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-80)",
                letterSpacing: "-0.005em",
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              }}
            >
              {task.note}
            </div>
          )}
          {task.due_date && (
            <div
              style={{
                paddingTop: task.note ? 6 : 8,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-40)",
                letterSpacing: "-0.005em",
              }}
            >
              {dayCardHeader(task.due_date, lang)}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

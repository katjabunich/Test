"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Habit } from "@/lib/data";
import { toggleHabitLog } from "@/lib/actions";
import { computeStreak, isScheduledOn } from "@/lib/habits";
import { addDays, today } from "@/lib/date";
import { HabitIcon } from "@/components/Icons";
import { fireConfetti, isStreakMilestone } from "@/lib/celebrate";
import { feedbackHabitComplete, feedbackStreakMilestone } from "@/lib/feedback";
import { useT, useDaysWord } from "@/lib/i18n/client";
import { Card } from "@/components/ui";

/** Habit list row: white Card (--radius-lg, --shadow-card) with thin ring
    on the left, name + 14-day heatmap in the middle, plump streak number
    on the right. */
export default function HabitCard({
  habit,
  logged,
  onEdit,
}: {
  habit: Habit;
  logged: Set<string>;
  onEdit: (habit: Habit) => void;
}) {
  const t = useT();
  const daysWord = useDaysWord();
  const color = habit.color || "var(--mint)";
  /* Candy seed colours from the DB get pulled toward warm ink so strokes
     and fills sit inside the adult "dawn" palette without losing the
     habit's own hue. */
  const mutedColor = `color-mix(in srgb, ${color} 80%, #3B2E26)`;

  const [localLogged, setLocalLogged] = useState<Set<string>>(new Set(logged));
  const [, startTransition] = useTransition();

  const streak = useMemo(() => computeStreak(habit, localLogged), [habit, localLogged]);

  // Celebrate when the streak crosses upward through a milestone.
  const prevStreak = useRef(streak);
  useEffect(() => {
    if (streak > prevStreak.current && isStreakMilestone(streak)) {
      void fireConfetti(habit.color || undefined);
      feedbackStreakMilestone();
    }
    prevStreak.current = streak;
  }, [streak, habit.color]);

  const todayIso = today();
  const doneToday = localLogged.has(todayIso);

  /* Two-week rolling heatmap (oldest on the left, today on the right). 21
     days felt sparse for new users and hard to scan past the first stretch
     of consistency; two weeks gives a dense, readable canvas that fills in
     quickly enough to feel rewarding. */
  const cells = useMemo(() => {
    const out: Array<{ date: string; done: boolean; scheduled: boolean }> = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDays(todayIso, -i);
      out.push({
        date,
        done: localLogged.has(date),
        scheduled: isScheduledOn(habit, date),
      });
    }
    return out;
  }, [habit, localLogged, todayIso]);

  const weekDone = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) if (localLogged.has(addDays(todayIso, -i))) n++;
    return n;
  }, [localLogged, todayIso]);

  function toggleToday() {
    const next = new Set(localLogged);
    if (next.has(todayIso)) next.delete(todayIso);
    else {
      next.add(todayIso);
      // Tick on toggle-on; milestone celebration handled by the streak effect
      // above so it doesn't fire alongside the regular tick.
      const wouldBeMilestone = isStreakMilestone(streak + 1);
      if (!wouldBeMilestone) feedbackHabitComplete();
    }
    setLocalLogged(next);
    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, todayIso);
      } catch {
        setLocalLogged(logged);
      }
    });
  }

  const stroke = 2;
  const size = 48;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(7, weekDone) / 7);

  return (
    <Card
      onClick={() => onEdit(habit)}
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleToday();
        }}
        aria-label={doneToday ? "Снять отметку" : "Отметить выполненной"}
        className="tap"
        style={{
          position: "relative",
          width: size,
          height: size,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--ink-10)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={mutedColor}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 380ms var(--ease-out)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: "50%",
            background: doneToday ? mutedColor : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 220ms var(--ease-out)",
            /* Muted fill trends dark — cream icon keeps contrast when done. */
            color: doneToday ? "#FBF3EA" : mutedColor,
          }}
        >
          <HabitIcon
            value={habit.emoji}
            size={20}
            stroke="currentColor"
            strokeWidth={2}
          />
        </div>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {habit.name}
        </div>
        <div
          aria-label={`${weekDone}/7 ${t("habits.week_progress")}`}
          style={{
            marginTop: 6,
            display: "flex",
            gap: 2,
          }}
        >
          {cells.map((c) => (
            <span
              key={c.date}
              style={{
                width: 7,
                height: 7,
                borderRadius: 1.5,
                background: c.done
                  ? mutedColor
                  : c.scheduled
                  ? "var(--ink-10)"
                  : "transparent",
                border: c.done ? "none" : "1px solid var(--ink-05)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div
          className="tnum"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "var(--ink)",
          }}
        >
          {streak}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-40)",
            letterSpacing: "-0.005em",
          }}
        >
          {daysWord(streak)} {t("habits.in_a_row")}
        </div>
      </div>
    </Card>
  );
}

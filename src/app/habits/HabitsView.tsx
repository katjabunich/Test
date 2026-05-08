"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog } from "@/lib/data";
import HabitCard from "@/components/HabitCard";
import HabitEditModal from "@/components/HabitEditModal";
import { HabitIcon } from "@/components/Icons";
import { computeStreak, groupLogsByHabit } from "@/lib/habits";
import { useT } from "@/lib/i18n/client";

export default function HabitsView({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  useEffect(() => {
    if (search.get("new") === "1") {
      setEditing(null);
      setModalOpen(true);
      router.replace("/habits", { scroll: false });
    }
  }, [search, router]);

  const logsByHabit = useMemo(() => groupLogsByHabit(logs), [logs]);

  const withStreak = useMemo(
    () =>
      habits.map((h) => ({
        habit: h,
        streak: computeStreak(h, logsByHabit.get(h.id) ?? new Set()),
      })),
    [habits, logsByHabit],
  );

  const top = useMemo(
    () => withStreak.slice().sort((a, b) => b.streak - a.streak)[0] ?? null,
    [withStreak],
  );

  return (
    <>
      <div style={{ padding: "8px 22px 18px" }}>
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
          {t("habits.title")}
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
          {t("habits.sub")}
        </div>
      </div>

      {/* Hero — best streak (full-bleed mint, emotional centre) */}
      {top && top.streak > 0 && (
        <div style={{ padding: "0 0 18px" }}>
          <div
            style={{
              background: "var(--mint)",
              borderRadius: 22,
              margin: "0 18px",
              padding: "22px 22px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -28,
                bottom: -28,
                opacity: 0.25,
                pointerEvents: "none",
                color: "var(--paper)",
              }}
            >
              <HabitIcon
                value={top.habit.emoji}
                size={170}
                stroke="currentColor"
                strokeWidth={1.3}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--paper)",
                opacity: 0.85,
                letterSpacing: "-0.005em",
                position: "relative",
              }}
            >
              {t("habits.best_streak")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginTop: 10,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: "50%",
                  border: "2.5px solid var(--paper)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  className="tnum"
                  style={{
                    fontFamily: "var(--font-emphasis)",
                    fontSize: 76,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.9,
                    color: "var(--paper)",
                  }}
                >
                  {top.streak}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--paper)",
                    opacity: 0.85,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t("habits.days")}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--paper)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {top.habit.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          padding: "0 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {habits.length === 0 ? (
          <div
            style={{
              padding: "26px 22px 22px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14.5,
              background: "var(--paper-warm)",
              border: "1px solid var(--ink-05)",
              borderRadius: 22,
              lineHeight: 1.5,
            }}
          >
            {t("habits.empty_body")}{" "}
            <span className="mark-butter">{t("habits.empty_title")}</span>.
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="tap"
              style={{
                display: "inline-block",
                marginTop: 14,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "var(--mint-deep)",
                color: "var(--paper)",
                fontSize: 13.5,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                cursor: "pointer",
              }}
            >
              {t("habits.add")}
            </button>
          </div>
        ) : (
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
              {t("habits.title")}
            </div>
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logged={logsByHabit.get(habit.id) ?? new Set()}
                onEdit={(h) => {
                  setEditing(h);
                  setModalOpen(true);
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="tap"
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1.5px dashed var(--ink-20)",
                background: "transparent",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-60)",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              {t("habits.add")}
            </button>
          </>
        )}
      </div>

      <HabitEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        habit={editing}
      />
    </>
  );
}


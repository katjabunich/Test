"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog } from "@/lib/data";
import HabitCard from "@/components/HabitCard";
import HabitEditModal from "@/components/HabitEditModal";
import { HabitIcon } from "@/components/Icons";
import { computeStreak, groupLogsByHabit } from "@/lib/habits";

export default function HabitsView({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const router = useRouter();
  const search = useSearchParams();
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
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            marginBottom: 8,
            letterSpacing: "0.12em",
          }}
        >
          <span className="tnum">{habits.length}</span>{" "}
          {habits.length === 1 ? "АКТИВНАЯ" : "АКТИВНЫЕ"}
        </div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Привычки<span style={{ color: "var(--mint-deep)" }}>.</span>
        </h1>
      </div>

      {/* Hero — best streak */}
      {top && top.streak > 0 && (
        <div style={{ padding: "0 18px 14px" }}>
          <div
            style={{
              background: "var(--mint)",
              borderRadius: 22,
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -22,
                bottom: -22,
                opacity: 0.16,
                pointerEvents: "none",
                color: "var(--ink)",
              }}
            >
              <HabitIcon
                value={top.habit.emoji}
                size={150}
                stroke="currentColor"
                strokeWidth={1.3}
              />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink)",
                opacity: 0.65,
                letterSpacing: "0.13em",
                position: "relative",
              }}
            >
              ЛУЧШИЙ СТРИК
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 14,
                marginTop: 6,
                position: "relative",
              }}
            >
              <div
                className="tnum"
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: "-0.045em",
                  lineHeight: 0.85,
                  color: "var(--ink)",
                }}
              >
                {top.streak}
              </div>
              <div style={{ paddingBottom: 6 }}>
                <div
                  className="mono lower"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--ink)",
                    opacity: 0.65,
                  }}
                >
                  дней подряд
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
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
              padding: "40px 22px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14.5,
              background: "var(--paper-warm)",
              border: "1px solid var(--ink-05)",
              borderRadius: 16,
              lineHeight: 1.5,
            }}
          >
            Пока пусто. Жми + чтобы добавить.
          </div>
        ) : (
          <>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--ink-60)",
                padding: "0 4px 4px",
                letterSpacing: "0.1em",
              }}
            >
              ВСЕ ПРИВЫЧКИ
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

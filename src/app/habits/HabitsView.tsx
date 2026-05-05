"use client";

import { useState } from "react";
import type { Habit, HabitLog } from "@/lib/data";
import HabitCard from "@/components/HabitCard";
import HabitEditModal from "@/components/HabitEditModal";
import Fab from "@/components/Fab";
import { groupLogsByHabit } from "@/lib/habits";

export default function HabitsView({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const logsByHabit = groupLogsByHabit(logs);

  return (
    <div style={{ padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: "20px 22px" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>привычки</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
            color: "var(--text-display)",
            lineHeight: 1.1,
          }}
        >
          <span className="tnum">{habits.length}</span>{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            {habits.length === 0 ? "пока нет" : "активных"}
          </span>
        </h1>
      </div>

      {habits.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "40px 22px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14.5,
            lineHeight: 1.55,
          }}
        >
          Добавь привычку — например, играть на пианино или урок голландского.
        </div>
      ) : (
        habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            logged={logsByHabit.get(habit.id) ?? new Set()}
            onEdit={(h) => {
              setEditing(h);
              setModalOpen(true);
            }}
          />
        ))
      )}

      <Fab
        label="Новая привычка"
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />
      <HabitEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        habit={editing}
      />
    </div>
  );
}

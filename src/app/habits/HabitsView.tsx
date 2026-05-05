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
    <div style={{ padding: "20px 16px 16px" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          margin: "0 0 16px 4px",
        }}
      >
        Привычки
      </h1>

      {habits.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "var(--text-muted)",
            fontSize: 15,
          }}
        >
          Пока пусто. Добавь привычку, чтобы видеть стрики.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        </div>
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

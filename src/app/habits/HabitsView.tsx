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
    <div style={{ padding: "26px 18px 16px" }}>
      <header style={{ marginBottom: 18, padding: "0 4px" }}>
        <div className="label" style={{ marginBottom: 6 }}>привычки</div>
        <h1 className="heading-display">
          <span className="tnum">{habits.length}</span>{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            активных
          </span>
        </h1>
      </header>

      {habits.length === 0 ? (
        <div
          className="glass"
          style={{
            padding: "48px 22px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14.5,
            lineHeight: 1.55,
          }}
        >
          Пока пусто. Добавь привычку — например, играть на пианино или урок голландского.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="stagger">
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

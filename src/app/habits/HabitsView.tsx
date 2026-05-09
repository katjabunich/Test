"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Habit, HabitLog } from "@/lib/data";
import HabitCard from "@/components/HabitCard";
import HabitEditModal from "@/components/HabitEditModal";
import { HabitIcon, parseHabitIcon } from "@/components/Icons";
import { computeStreak, groupLogsByHabit } from "@/lib/habits";
import { reorderHabits } from "@/lib/actions";
import { useT, useDaysWord } from "@/lib/i18n/client";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const daysWord = useDaysWord();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  useEffect(() => {
    if (search.get("new") === "1") {
      setEditing(null);
      setModalOpen(true);
      router.replace("/habits", { scroll: false });
    }
  }, [search, router]);

  /* Drag-to-reorder — optimistic local order persisted via reorderHabits. */
  const [order, setOrder] = useState<string[]>(() => habits.map((h) => h.id));
  useEffect(() => {
    setOrder(habits.map((h) => h.id));
  }, [habits]);
  const [, startReorder] = useTransition();

  const orderedHabits = useMemo(() => {
    const byId = new Map(habits.map((h) => [h.id, h]));
    const out: Habit[] = [];
    for (const id of order) {
      const h = byId.get(id);
      if (h) out.push(h);
    }
    for (const h of habits) if (!order.includes(h.id)) out.push(h);
    return out;
  }, [order, habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startReorder(async () => {
      try {
        await reorderHabits(next);
      } catch (e) {
        console.error("reorderHabits:", e);
        setOrder(habits.map((h) => h.id));
      }
    });
  }

  const logsByHabit = useMemo(() => groupLogsByHabit(logs), [logs]);

  const withStreak = useMemo(
    () =>
      orderedHabits.map((h) => ({
        habit: h,
        streak: computeStreak(h, logsByHabit.get(h.id) ?? new Set()),
      })),
    [orderedHabits, logsByHabit],
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
            {parseHabitIcon(top.habit.emoji).kind === "icon" ? (
              /* Line-art icons spill off the corner — partial silhouette
                 reads as ambient decor. Emoji glyphs would look mangled
                 when clipped, so they get a smaller inline placement. */
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
            ) : (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: 22,
                  top: 18,
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              >
                <HabitIcon
                  value={top.habit.emoji}
                  size={64}
                  stroke="currentColor"
                  strokeWidth={1.3}
                />
              </div>
            )}
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
                  {daysWord(top.streak)} {t("habits.in_a_row")}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {orderedHabits.map((habit) => (
                    <SortableHabitCard
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
              </SortableContext>
            </DndContext>
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

/** HabitCard wrapped for @dnd-kit/sortable. The drag transform applies to
    the wrapper; HabitCard itself is unchanged so its inner ring-tap and
    onEdit still work. A 250ms long-press starts the drag on touch — quick
    taps fall through to the card's onClick. */
function SortableHabitCard({
  habit,
  logged,
  onEdit,
}: {
  habit: Habit;
  logged: Set<string>;
  onEdit: (h: Habit) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 2 : "auto",
    boxShadow: isDragging
      ? "0 14px 28px rgba(45,38,32,0.20), 0 2px 6px rgba(45,38,32,0.10)"
      : "none",
    borderRadius: 16,
    touchAction: "manipulation",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HabitCard habit={habit} logged={logged} onEdit={onEdit} />
    </div>
  );
}


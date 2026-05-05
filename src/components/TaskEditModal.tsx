"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere, Task, Recurrence } from "@/lib/data";
import { createTask, updateTask, deleteTask } from "@/lib/actions";
import { RECURRENCE_LABELS } from "@/lib/recurrence";

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  spheres: Sphere[];
  defaultSphereId?: string | null;
};

const RECURRENCES: Recurrence[] = [null, "daily", "weekly", "biweekly", "monthly"];

export default function TaskEditModal({ open, onClose, task, spheres, defaultSphereId }: Props) {
  const isEdit = !!task;
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [sphereId, setSphereId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [doToday, setDoToday] = useState(false);
  const [note, setNote] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setSphereId(task.sphere_id);
      setDueDate(task.due_date ?? "");
      setDoToday(task.do_today);
      setNote(task.note ?? "");
      setRecurrence(task.recurrence);
    } else {
      setTitle("");
      setSphereId(defaultSphereId ?? null);
      setDueDate("");
      setDoToday(false);
      setNote("");
      setRecurrence(null);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, task, defaultSphereId]);

  if (!open) return null;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const payload = {
          title: trimmed,
          sphere_id: sphereId,
          due_date: dueDate || null,
          do_today: doToday,
          note: note.trim() || null,
          recurrence,
        };
        if (isEdit && task) {
          await updateTask(task.id, payload);
        } else {
          await createTask(payload);
        }
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function remove() {
    if (!task) return;
    if (!confirm("Удалить задачу?")) return;
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 30, 0.25)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          background: "var(--bg-base)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -8px 32px rgba(10, 40, 40, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 500 }}>
            {isEdit ? "Изменить" : "Новая задача"}
          </span>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              border: "none",
              background: "rgba(0,0,0,0.04)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 17,
            border: "1px solid var(--hairline)",
            borderRadius: 12,
            background: "white",
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        {/* Spheres */}
        <div style={{ marginTop: 16 }}>
          <Label>Сфера</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <SphereButton
              selected={sphereId === null}
              color="#9CA8B0"
              label="Без сферы"
              onClick={() => setSphereId(null)}
            />
            {spheres.map((s) => (
              <SphereButton
                key={s.id}
                selected={sphereId === s.id}
                color={s.color}
                label={s.name}
                emoji={s.emoji ?? undefined}
                onClick={() => setSphereId(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Date + Do today */}
        <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "stretch" }}>
          <div style={{ flex: 1 }}>
            <Label>Дата</Label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: 8,
                fontSize: 15,
                border: "1px solid var(--hairline)",
                borderRadius: 12,
                background: "white",
                outline: "none",
                colorScheme: "light",
              }}
            />
          </div>
          <div style={{ flexShrink: 0, paddingTop: 24 }}>
            <ToggleChip
              active={doToday}
              onClick={() => setDoToday(!doToday)}
              label="сегодня"
            />
          </div>
        </div>

        {/* Recurrence */}
        <div style={{ marginTop: 16 }}>
          <Label>Повтор</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {RECURRENCES.map((r) => (
              <ToggleChip
                key={r ?? "none"}
                active={recurrence === r}
                onClick={() => setRecurrence(r)}
                label={r ? RECURRENCE_LABELS[r] : "не повторять"}
              />
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: 16 }}>
          <Label>Заметка</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="—"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginTop: 8,
              fontSize: 15,
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              background: "white",
              outline: "none",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--hairline)",
                background: "transparent",
                color: "#C46E5A",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Удалить
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !title.trim()}
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: 12,
              border: "none",
              background: title.trim() ? "var(--accent)" : "var(--accent-soft)",
              color: "white",
              cursor: title.trim() ? "pointer" : "not-allowed",
              fontSize: 16,
              fontWeight: 500,
              transition: "background 150ms ease",
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        opacity: 0.7,
      }}
    >
      {children}
    </div>
  );
}

function SphereButton({
  selected,
  color,
  label,
  emoji,
  onClick,
}: {
  selected: boolean;
  color: string;
  label: string;
  emoji?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 11px",
        borderRadius: 999,
        border: selected ? `1.5px solid ${color}` : "1px solid var(--hairline)",
        background: selected ? `${color}26` : "white",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        border: active ? "1.5px solid var(--accent)" : "1px solid var(--hairline)",
        background: active ? "var(--accent-tint)" : "white",
        color: active ? "var(--accent-deep)" : "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

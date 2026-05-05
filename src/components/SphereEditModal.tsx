"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere } from "@/lib/data";
import { createSphere, updateSphere, deleteSphere } from "@/lib/actions";

const COLORS = [
  "#7DAEC4", "#F5B5A8", "#F4C77A", "#E89B8E", "#9CA8B0",
  "#0ABAB5", "#B5DCC4", "#D4B0E0", "#9DC9E8", "#E8C99B",
];

type Props = {
  open: boolean;
  onClose: () => void;
  sphere?: Sphere | null;
};

export default function SphereEditModal({ open, onClose, sphere }: Props) {
  const isEdit = !!sphere;
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (sphere) {
      setName(sphere.name);
      setEmoji(sphere.emoji ?? "");
      setColor(sphere.color);
    } else {
      setName("");
      setEmoji("");
      setColor(COLORS[0]);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, sphere]);

  if (!open) return null;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        if (isEdit && sphere) {
          await updateSphere(sphere.id, { name: trimmed, color, emoji: emoji.trim() || null });
        } else {
          await createSphere({ name: trimmed, color, emoji: emoji.trim() || null });
        }
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function remove() {
    if (!sphere) return;
    if (!confirm("Удалить сферу? Задачи в ней останутся, но без сферы.")) return;
    startTransition(async () => {
      try {
        await deleteSphere(sphere.id);
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
        position: "fixed", inset: 0,
        background: "rgba(20, 30, 30, 0.25)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430,
          background: "var(--bg-base)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 32px rgba(10, 40, 40, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 500 }}>
            {isEdit ? "Изменить сферу" : "Новая сфера"}
          </span>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              width: 32, height: 32, borderRadius: 16, border: "none",
              background: "rgba(0,0,0,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
            placeholder="✨"
            style={{
              width: 56, padding: "12px 0",
              fontSize: 22, border: "1px solid var(--hairline)",
              borderRadius: 12, background: "white", outline: "none",
              textAlign: "center",
            }}
          />
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            style={{
              flex: 1, padding: "12px 14px",
              fontSize: 17, border: "1px solid var(--hairline)",
              borderRadius: 12, background: "white", outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", opacity: 0.7 }}>
            Цвет
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2.5px solid var(--text)" : "2px solid white",
                  cursor: "pointer",
                  outline: color === c ? "2px solid white" : "none",
                  outlineOffset: -4,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
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
            disabled={isPending || !name.trim()}
            style={{
              flex: 1, padding: "13px 16px",
              borderRadius: 12, border: "none",
              background: name.trim() ? "var(--accent)" : "var(--accent-soft)",
              color: "white",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 16, fontWeight: 500,
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

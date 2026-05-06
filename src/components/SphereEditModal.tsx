"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere } from "@/lib/data";
import { createSphere, deleteSphere, updateSphere } from "@/lib/actions";
import { Icons } from "@/components/Icons";

const COLORS = [
  "#86c79a", // mint
  "#f3a78b", // peach
  "#f5c563", // butter
  "#7d96a8", // pool
  "#b5a3df", // lilac
  "#e89bb0", // blush
  "#0ABAB5", // tiffany
  "#d96a52", // alert (use carefully)
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
          await updateSphere(sphere.id, {
            name: trimmed,
            color,
            emoji: emoji.trim() || null,
          });
        } else {
          await createSphere({
            name: trimmed,
            color,
            emoji: emoji.trim() || null,
          });
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
        position: "fixed",
        inset: 0,
        background: "rgba(45,38,32,0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
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
          maxWidth: 460,
          background: "var(--paper)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "10px 22px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(45,38,32,0.18)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4.5,
            background: "var(--ink-20)",
            borderRadius: 3,
            margin: "0 auto 16px",
          }}
        />
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginBottom: 14,
            letterSpacing: "-0.005em",
          }}
        >
          {isEdit ? "Сфера" : "Новая сфера"}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
            placeholder="✨"
            style={{
              width: 56,
              padding: "12px 0",
              fontSize: 22,
              border: "1px solid var(--ink-10)",
              borderRadius: 12,
              background: "var(--paper-warm)",
              outline: "none",
              textAlign: "center",
            }}
          />
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              border: "1px solid var(--ink-10)",
              borderRadius: 12,
              background: "var(--paper-warm)",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginBottom: 10,
            letterSpacing: "-0.005em",
          }}
        >
          Цвет
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className="tap"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border:
                  color === c
                    ? "2.5px solid var(--ink)"
                    : "2px solid var(--paper)",
                outline: color === c ? "2px solid var(--paper)" : "none",
                outlineOffset: -4,
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="tap"
              style={{
                padding: "13px 14px",
                borderRadius: 14,
                border: "1px solid var(--ink-10)",
                background: "transparent",
                color: "var(--alert)",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icons.Trash size={15} stroke="var(--alert)" strokeWidth={1.8} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim()}
            className="tap"
            style={{
              flex: 1,
              padding: "15px 0",
              borderRadius: 14,
              background: name.trim()
                ? "var(--mint-deep)"
                : "rgba(79,156,106,0.4)",
              color: "#fff",
              border: "none",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: name.trim()
                ? "0 6px 16px rgba(79,156,106,0.4)"
                : "none",
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

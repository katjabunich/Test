"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Sphere } from "@/lib/data";
import { createSphere, deleteSphere, updateSphere } from "@/lib/actions";
import { Icons } from "@/components/Icons";
import { feedbackModalOpen } from "@/lib/feedback";
import { useT } from "@/lib/i18n/client";
import { SectionLabel } from "@/components/ui";

const COLORS = [
  "#86c79a", // mint
  "#f4936e", // peach
  "#f5c563", // butter
  "#6ba4c2", // pool
  "#b5a3df", // lilac
  "#e89bb0", // blush
  "#0ABAB5", // tiffany
  "#d96a52", // alert (use carefully)
];

/* Curated emoji shortlist for life-area spheres. Picked to cover the
   common buckets (home / work / learning / relationships / hobbies /
   wellness) without forcing a generic keyboard. The custom-emoji input
   below the grid still lets a user paste anything they want. */
const SPHERE_EMOJI_PRESETS = [
  "🏠", "💼", "📚", "🎨",
  "🏃", "🍳", "💰", "❤️",
  "✈️", "🌱", "🎵", "🎬",
  "🐾", "🧘", "👶", "🎁",
];

type Props = {
  open: boolean;
  onClose: () => void;
  sphere?: Sphere | null;
};

export default function SphereEditModal({ open, onClose, sphere }: Props) {
  const t = useT();
  const isEdit = !!sphere;
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    feedbackModalOpen();
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
    if (!confirm(t("sphere.delete_confirm"))) return;
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
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          padding: "10px 20px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.cancel")}
          className="tap"
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "6px 0 14px",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "block",
              width: 40,
              height: 4.5,
              background: "var(--ink-20)",
              borderRadius: 3,
              margin: "0 auto",
            }}
          />
        </button>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
            color: "var(--ink-strong)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 18,
          }}
        >
          {isEdit ? t("sphere.title_edit") : t("sphere.title_new")}
        </div>

        {/* Preview tile (uses current colour) + name input on same row. */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-sm)",
              /* Mute the candy DB colour when it paints a surface. */
              background: `color-mix(in srgb, #FFFFFF 75%, ${color})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 28,
              lineHeight: 1.1,
            }}
          >
            {emoji || "·"}
          </div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("sphere.name_ph")}
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              border: "1.5px solid var(--ink-10)",
              borderRadius: "var(--radius-sm)",
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

        {/* Emoji picker grid — preset shortlist + a small custom-input
            for anything else. Replaces the previous single text field,
            which (a) opened the keyboard immediately and (b) let users
            type plain text that wouldn't render anywhere. */}
        <SectionLabel style={{ marginBottom: 10 }}>
          {t("sphere.icon_label")}
        </SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {SPHERE_EMOJI_PRESETS.map((e) => {
            const active = emoji === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={e}
                className="tap"
                style={{
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--ink-10)"}`,
                  background: active ? "var(--ink)" : "var(--paper-warm)",
                  fontSize: 20,
                  lineHeight: 1.1,
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-60)",
              flexShrink: 0,
              letterSpacing: "-0.005em",
            }}
          >
            {t("sphere.icon_custom")}
          </span>
          <input
            value={
              emoji && SPHERE_EMOJI_PRESETS.includes(emoji) ? "" : emoji
            }
            onChange={(e) => {
              /* Strip Latin/Cyrillic letters and digits so the field can
                 only hold emoji/punctuation glyphs, matching the user's
                 expectation that this is an emoji-only picker. */
              const v = e.target.value.replace(/[\p{L}\p{N}]/gu, "").slice(0, 4);
              setEmoji(v);
            }}
            placeholder="✨"
            style={{
              width: 70,
              padding: "8px 0",
              fontSize: 18,
              border: "1.5px solid var(--ink-10)",
              borderRadius: "var(--radius-sm)",
              background: "var(--paper-warm)",
              outline: "none",
              textAlign: "center",
            }}
          />
          {emoji && (
            <button
              type="button"
              onClick={() => setEmoji("")}
              aria-label={t("common.cancel")}
              className="tap"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-40)",
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          )}
        </div>

        <SectionLabel style={{ marginBottom: 10 }}>
          {t("sphere.color_label")}
        </SectionLabel>
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
                padding: "13px 16px",
                borderRadius: 999,
                border: "1.5px solid var(--ink-10)",
                background: "#FFFFFF",
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
              borderRadius: 999,
              background: name.trim()
                ? "var(--terra)"
                : "var(--ink-20)",
              color: "#FFFFFF",
              border: "none",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              boxShadow: name.trim()
                ? "0 6px 16px rgba(184,92,58,0.35)"
                : "none",
            }}
          >
            {t("common.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

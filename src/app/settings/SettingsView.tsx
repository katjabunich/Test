"use client";

import { useState } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";
import { Icons, SphereIcon } from "@/components/Icons";

export default function SettingsView({ spheres }: { spheres: Sphere[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);

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
            letterSpacing: "0.13em",
          }}
        >
          ПЕРСОНАЛИЗАЦИЯ
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
          Настройки<span style={{ color: "var(--mint-deep)" }}>.</span>
        </h1>
      </div>

      <div style={{ padding: "0 18px" }}>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            padding: "0 4px 10px",
            letterSpacing: "0.1em",
          }}
        >
          СФЕРЫ ЖИЗНИ
        </div>

        <div
          style={{
            background: "var(--paper-warm)",
            borderRadius: 18,
            border: "1px solid var(--ink-05)",
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          {spheres.length === 0 ? (
            <div
              style={{
                padding: "24px 14px",
                textAlign: "center",
                color: "var(--ink-60)",
                fontSize: 14,
              }}
            >
              Пока пусто.
            </div>
          ) : (
            spheres.map((s, i) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setEditing(s);
                  setModalOpen(true);
                }}
                className="tap"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom:
                    i === spheres.length - 1
                      ? "none"
                      : "1px solid var(--ink-05)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <SphereIcon
                    name={s.name}
                    size={18}
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.name}
                  </span>
                </span>
                <Icons.Chevron size={16} stroke="var(--ink-40)" />
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="tap mono lower"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 14,
            border: "1.5px dashed var(--ink-20)",
            background: "transparent",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-60)",
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          + Добавить сферу
        </button>

        <div
          className="mono"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--ink-60)",
            padding: "0 4px 10px",
            letterSpacing: "0.1em",
          }}
        >
          ПРИЛОЖЕНИЕ
        </div>

        <div
          style={{
            background: "var(--paper-warm)",
            borderRadius: 18,
            border: "1px solid var(--ink-05)",
            overflow: "hidden",
          }}
        >
          <SettingsRow
            Icon={Icons.Phone}
            label="Установить на главный"
            value="PWA"
            accent
          />
          <SettingsRow
            Icon={Icons.Bell}
            label="Уведомления"
            value="—"
            disabled
          />
          <SettingsRow
            Icon={Icons.Cloud}
            label="Резервная копия"
            value="облако"
            disabled
            last
          />
        </div>

        <p
          style={{
            marginTop: 22,
            padding: "0 6px",
            fontSize: 12,
            color: "var(--ink-40)",
            lineHeight: 1.6,
          }}
        >
          v1 · приложение для одного пользователя.
          <br />
          Дальше: вход, цели, экспорт.
        </p>
      </div>

      <SphereEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={editing}
      />
    </>
  );
}

function SettingsRow({
  Icon,
  label,
  value,
  accent,
  disabled,
  last,
}: {
  Icon: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
  label: string;
  value: string;
  accent?: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const accentColor = accent ? "var(--mint-deep)" : "var(--ink-60)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        borderBottom: last ? "none" : "1px solid var(--ink-05)",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon size={18} stroke={accentColor} strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: accent ? 600 : 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        className="mono lower"
        style={{ fontSize: 11, fontWeight: 600, color: accentColor }}
      >
        {value}
      </span>
      <Icons.Chevron size={15} stroke="var(--ink-40)" />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";

export default function SettingsView({ spheres }: { spheres: Sphere[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);

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
        Настройки
      </h1>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 8px 8px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              opacity: 0.7,
            }}
          >
            Сферы
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
              background: "var(--accent-tint)",
              color: "var(--accent-deep)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Сфера
          </button>
        </div>

        <div className="glass" style={{ padding: 4 }}>
          {spheres.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)" }}>
              Пока пусто.
            </div>
          ) : (
            spheres.map((s, i) => (
              <div key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(s);
                    setModalOpen(true);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text)",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `${s.color}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      flexShrink: 0,
                    }}
                  >
                    {s.emoji || "•"}
                  </span>
                  <span style={{ flex: 1, fontSize: 16 }}>{s.name}</span>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: 4 }}>›</span>
                </button>
                {i < spheres.length - 1 && (
                  <div style={{ height: 1, background: "var(--hairline)", margin: "0 14px" }} />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <p
        style={{
          marginTop: 24,
          padding: "0 8px",
          fontSize: 12,
          color: "var(--text-faint)",
          lineHeight: 1.5,
        }}
      >
        v1 · версия для одного пользователя.<br />
        В следующих версиях: вход, цели и стратегия, экспорт.
      </p>

      <SphereEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={editing}
      />
    </div>
  );
}

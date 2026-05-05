"use client";

import { useState } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";

export default function SettingsView({ spheres }: { spheres: Sphere[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);

  return (
    <div style={{ padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: "20px 22px" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>настройки</div>
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
          сферы и аккаунт
        </h1>
      </div>

      <div className="card" style={{ padding: "16px 6px 8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            marginBottom: 6,
          }}
        >
          <div className="label">
            сферы · <span className="tnum">{spheres.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="tap"
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--accent-soft)",
              background: "var(--accent-cream)",
              color: "var(--accent-deep)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Добавить
          </button>
        </div>

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
                className="tap"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text)",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: `linear-gradient(140deg, ${s.color}33, ${s.color}1A)`,
                    border: `1px solid ${s.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {s.emoji || "•"}
                </span>
                <span style={{ flex: 1, fontSize: 15.5, fontWeight: 500, letterSpacing: "-0.005em" }}>
                  {s.name}
                </span>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: s.color,
                    boxShadow: `0 0 0 2px ${s.color}1A`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 14, color: "var(--text-faint)" }}>›</span>
              </button>
              {i < spheres.length - 1 && (
                <div style={{ height: 1, background: "var(--hairline-soft)", margin: "0 16px" }} />
              )}
            </div>
          ))
        )}
      </div>

      <p
        style={{
          marginTop: 12,
          padding: "0 22px",
          fontSize: 12,
          color: "var(--text-faint)",
          lineHeight: 1.6,
        }}
      >
        v1 · приложение для одного пользователя.<br />
        В следующих версиях: вход, цели и стратегия, экспорт данных.
      </p>

      <SphereEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={editing}
      />
    </div>
  );
}

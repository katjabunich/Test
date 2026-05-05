"use client";

import { useState } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";

export default function SettingsView({ spheres }: { spheres: Sphere[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);

  return (
    <div style={{ padding: "26px 18px 16px" }}>
      <header style={{ marginBottom: 18, padding: "0 4px" }}>
        <div className="label" style={{ marginBottom: 6 }}>настройки</div>
        <h1 className="heading-display">сферы и аккаунт</h1>
      </header>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 8px 10px",
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
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
              background: "var(--accent-tint)",
              color: "var(--accent-deep)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Добавить
          </button>
        </div>

        <div className="glass" style={{ padding: 4 }}>
          {spheres.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", color: "var(--text-muted)" }}>
              Пока пусто.
            </div>
          ) : (
            <div className="stagger">
              {spheres.map((s, i) => (
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
                      padding: "14px 14px",
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
                        boxShadow: `0 0 0 2px ${s.color}1F`,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 14, color: "var(--text-faint)" }}>›</span>
                  </button>
                  {i < spheres.length - 1 && (
                    <div style={{ height: 1, background: "var(--hairline)", margin: "0 14px" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <p
        style={{
          marginTop: 28,
          padding: "0 8px",
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

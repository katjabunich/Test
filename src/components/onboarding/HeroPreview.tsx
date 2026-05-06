"use client";

import { Icons } from "@/components/Icons";

/** Editorial mini hero card for the first onboarding slide.
   Mirrors the v4 hero in TodayView with hardcoded sample data so the
   user sees a real-feeling fragment of what's inside. */
export default function HeroPreview() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        margin: "0 auto",
        background: "var(--butter)",
        borderRadius: 22,
        padding: "16px 18px 18px",
        position: "relative",
        overflow: "hidden",
        color: "var(--ink)",
        boxShadow: "0 8px 28px rgba(45,38,32,0.08)",
        animation: "splash-in 480ms 250ms var(--ease-spring) both",
      }}
    >
      {/* Decorative giant sphere icon, exactly like the real hero */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -16,
          bottom: -16,
          opacity: 0.14,
          pointerEvents: "none",
          color: "var(--ink)",
        }}
      >
        <Icons.Video size={120} stroke="currentColor" strokeWidth={1.3} />
      </div>

      {/* Sphere chip + time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          position: "relative",
        }}
      >
        <div
          className="mono lower"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(255,255,255,0.35)",
            borderRadius: 8,
            fontSize: 10.5,
            fontWeight: 600,
          }}
        >
          <Icons.Video size={11} stroke="var(--ink)" strokeWidth={2.2} />
          Канал
        </div>
        <div
          className="mono lower"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          11:00
        </div>
      </div>

      <div
        className="mono"
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          opacity: 0.6,
          marginBottom: 6,
          letterSpacing: "0.13em",
          position: "relative",
        }}
      >
        СЛЕДУЮЩАЯ
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.18,
          position: "relative",
        }}
      >
        Записать черновик ролика
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "11px 0",
            borderRadius: 12,
            background: "var(--ink)",
            color: "var(--butter)",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icons.Check size={14} stroke="var(--butter)" strokeWidth={2.6} />
          Сделать
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icons.Calendar size={17} stroke="var(--ink)" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

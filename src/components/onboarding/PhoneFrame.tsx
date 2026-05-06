"use client";

import type { CSSProperties, ReactNode } from "react";

/** Premium iPhone 15-style frame with metallic bezel highlights, an
   ambient screen glow tinted to the slide accent, and a tinted
   drop-shadow that picks up the slide's mood. */
export default function PhoneFrame({
  children,
  tilt = 0,
  rotateY = 0,
  rotateX = 0,
  accent,
  ambient,
  style,
}: {
  children: ReactNode;
  tilt?: number;
  rotateY?: number;
  rotateX?: number;
  /** Tints the cast shadow under the device. */
  accent?: string;
  /** Tints a soft top-radial inside the screen, suggesting room light. */
  ambient?: string;
  style?: CSSProperties;
}) {
  const transform = `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotate(${tilt}deg)`;
  const tintedShadow = accent
    ? `drop-shadow(0 28px 50px ${accent}33) drop-shadow(0 8px 18px rgba(45,38,32,0.18))`
    : `drop-shadow(0 28px 50px rgba(45,38,32,0.22)) drop-shadow(0 8px 16px rgba(45,38,32,0.10))`;
  return (
    <div
      style={{
        width: 220,
        height: 475,
        transform,
        transformStyle: "preserve-3d",
        filter: tintedShadow,
        ...style,
      }}
    >
      {/* Outer bezel — metallic gradient with explicit light direction */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(105deg, #1c1612 0%, #2d2620 35%, #3a3128 60%, #2a221c 100%)",
          borderRadius: 42,
          padding: 7,
          position: "relative",
        }}
      >
        {/* Side highlights suggesting polished aluminium */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 60,
            right: -1,
            width: 1,
            height: 80,
            background: "rgba(255,255,255,0.28)",
            borderRadius: 1,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 160,
            right: -1,
            width: 1,
            height: 60,
            background: "rgba(255,255,255,0.18)",
            borderRadius: 1,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 90,
            left: -1,
            width: 1,
            height: 40,
            background: "rgba(255,255,255,0.10)",
            borderRadius: 1,
          }}
        />

        {/* 1px chamfer line just inside the bezel — gives the frame a
           lighter "polished edge" against the screen */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: 36,
            border: "0.5px solid rgba(255,255,255,0.10)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Inner screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "var(--paper)",
            borderRadius: 35,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Ambient room-light highlight on the screen */}
          {ambient && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -120,
                left: "50%",
                transform: "translateX(-50%)",
                width: 360,
                height: 280,
                background: `radial-gradient(closest-side, ${ambient}38, transparent 70%)`,
                pointerEvents: "none",
                zIndex: 1,
                filter: "blur(8px)",
              }}
            />
          )}

          {/* Dynamic island — subtle inner gradient gives depth */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 78,
              height: 22,
              background:
                "radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, #050505 70%, #000 100%)",
              borderRadius: 12,
              boxShadow:
                "inset 0 1px 1px rgba(255,255,255,0.06), 0 0 0 0.5px rgba(0,0,0,0.6)",
              zIndex: 4,
            }}
          />

          {/* Status bar */}
          <div
            style={{
              position: "relative",
              padding: "11px 22px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 3,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              className="tnum"
              style={{
                color: "var(--ink)",
                letterSpacing: "-0.005em",
              }}
            >
              9:41
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <svg width="20" height="10" viewBox="0 0 22 11" aria-hidden>
                <rect
                  x="0.5"
                  y="0.5"
                  width="18"
                  height="10"
                  rx="2.5"
                  fill="none"
                  stroke="var(--ink)"
                  strokeOpacity="0.45"
                />
                <rect
                  x="2"
                  y="2"
                  width="15"
                  height="7"
                  rx="1.5"
                  fill="var(--ink)"
                />
              </svg>
            </div>
          </div>

          {/* Page content */}
          <div
            style={{
              position: "absolute",
              top: 38,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            {children}
          </div>

          {/* Screen reflection — softer now (0.18 → 0.10) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 22%, transparent 42%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 6,
              borderRadius: 35,
            }}
          />
        </div>
      </div>
    </div>
  );
}

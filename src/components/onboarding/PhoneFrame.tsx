"use client";

import type { CSSProperties, ReactNode } from "react";

/** A faithful iPhone 15-style frame: warm-dark bezel, dynamic island,
   status bar with 9:41 + battery, screen padded for content.

   The frame can be presented as a flat tilt (rotateZ via `tilt`) or in 3D
   perspective (rotateX/rotateY) — pass any combination. A subtle screen
   reflection overlay sits on top of the content for depth. */
export default function PhoneFrame({
  children,
  tilt = 0,
  rotateY = 0,
  rotateX = 0,
  style,
}: {
  children: ReactNode;
  tilt?: number;
  rotateY?: number;
  rotateX?: number;
  style?: CSSProperties;
}) {
  const transform = `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotate(${tilt}deg)`;
  return (
    <div
      style={{
        width: 220,
        height: 475,
        transform,
        transformStyle: "preserve-3d",
        filter:
          "drop-shadow(0 28px 50px rgba(45,38,32,0.22)) drop-shadow(0 8px 16px rgba(45,38,32,0.10))",
        ...style,
      }}
    >
      {/* Outer bezel */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(160deg, #2d2620 0%, #1c1612 50%, #25201a 100%)",
          borderRadius: 42,
          padding: 7,
          position: "relative",
        }}
      >
        {/* Polished metal highlights on the sides */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 60,
            left: -1,
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
            top: 140,
            left: -1,
            width: 1,
            height: 80,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 1,
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
          {/* Dynamic island */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 78,
              height: 22,
              background: "#000",
              borderRadius: 12,
              zIndex: 3,
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
              zIndex: 2,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              className="tnum"
              style={{
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                color: "var(--ink)",
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
            }}
          >
            {children}
          </div>

          {/* Screen reflection — diagonal soft highlight on top of everything,
             gives the device a subtle "glassy" feel. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 22%, transparent 42%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 4,
              borderRadius: 35,
            }}
          />
        </div>
      </div>
    </div>
  );
}

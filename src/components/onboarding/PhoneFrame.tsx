"use client";

import type { CSSProperties, ReactNode } from "react";

/** A faithful iPhone 15-style frame: warm-dark bezel, dynamic island,
   status bar with 9:41 + battery, screen padded for content. The frame
   is fixed at 220×475 — wrap the call site in transform: scale(...) if
   you need it smaller. */
export default function PhoneFrame({
  children,
  tilt = -2,
  style,
}: {
  children: ReactNode;
  tilt?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: 220,
        height: 475,
        transform: `rotate(${tilt}deg)`,
        filter:
          "drop-shadow(0 24px 44px rgba(45,38,32,0.18)) drop-shadow(0 6px 14px rgba(45,38,32,0.10))",
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
        {/* Tiny side highlight, suggestive of polished metal */}
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
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "dela.splashShown";

/** Sunrise splash. The sun rises from below the horizon, the horizon
   line draws across, then everything fades into the app. Shows once
   per browser session (so PWA cold-launches still get it). */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    const t1 = setTimeout(() => setPhase("out"), 1100);
    const t2 = setTimeout(() => setPhase("gone"), 1550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(180deg, #b7dcc4 0%, #86c79a 55%, #4f9c6a 100%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: phase === "out" ? "splash-out 440ms var(--ease-out) forwards" : "none",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Soft halo behind the sun, expanding gently */}
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -55%)",
          borderRadius: "50%",
          background: "rgba(251,246,238,0.28)",
          filter: "blur(40px)",
          animation: "sun-halo 1100ms 100ms var(--ease-out) both",
        }}
      />

      {/* Sun rises from below */}
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -55%)",
          animation: "sun-rise 900ms var(--ease-spring) both",
        }}
      >
        <defs>
          <radialGradient id="splash-sun" cx="0.4" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#fffaf2" />
            <stop offset="60%" stopColor="#fbf6ee" />
            <stop offset="100%" stopColor="#f5e9d4" />
          </radialGradient>
        </defs>
        <circle cx="90" cy="90" r="76" fill="url(#splash-sun)" />
      </svg>

      {/* Horizon line draws across */}
      <svg
        width="320"
        height="40"
        viewBox="0 0 320 40"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, 60px)",
          animation: "horizon-draw 700ms 350ms var(--ease-out) both",
          overflow: "visible",
        }}
      >
        <path
          d="M 4 18 Q 160 -2 316 18"
          stroke="#fbf6ee"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{
            animation: "horizon-trace 700ms 400ms var(--ease-out) forwards",
          }}
        />
        <path
          d="M 60 32 Q 160 22 260 32"
          stroke="#fbf6ee"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{
            animation: "horizon-trace 600ms 600ms var(--ease-out) forwards",
          }}
        />
      </svg>

      <style>{`
        @keyframes sun-rise {
          0%   { transform: translate(-50%, calc(-50% + 80px)) scale(0.8); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translate(-50%, -55%) scale(1); opacity: 1; }
        }
        @keyframes sun-halo {
          0%   { opacity: 0; transform: translate(-50%, -55%) scale(0.6); }
          70%  { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, -55%) scale(1); }
        }
        @keyframes horizon-draw {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes horizon-trace {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

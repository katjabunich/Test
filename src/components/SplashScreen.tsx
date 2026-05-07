"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "dela.splashShown";

/** Cinematic sunrise splash that lands on a "morning task list".
   Three full-screen sky layers cross-fade through dawn colours, the sun
   lifts to rest on the horizon, then 3 list strokes + a mint check appear
   underneath — same composition as the app icon. ~2.2s in + 0.5s out. */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    const t1 = setTimeout(() => setPhase("out"), 2200);
    const t2 = setTimeout(() => setPhase("gone"), 2700);
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
        background: "#1a1230",
        zIndex: 200,
        overflow: "hidden",
        animation: phase === "out" ? "splash-out 500ms var(--ease-out) forwards" : "none",
        pointerEvents: "none",
      }}
    >
      {/* Three sky layers — each fills the entire viewport and cross-fades
         to the next, so the whole screen transitions through dawn colours. */}
      <div className="splash-sky splash-sky--night" />
      <div className="splash-sky splash-sky--dawn" />
      <div className="splash-sky splash-sky--day" />

      {/* Soft halo behind the sun */}
      <div className="splash-halo" />

      {/* Sun */}
      <svg
        className="splash-sun"
        width="200"
        height="200"
        viewBox="0 0 200 200"
      >
        <defs>
          <radialGradient id="splash-sun-grad" cx="0.5" cy="0.45" r="0.55">
            <stop offset="0%" stopColor="#fffaf2" />
            <stop offset="70%" stopColor="#fff0c8" />
            <stop offset="100%" stopColor="#ffd57a" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#splash-sun-grad)" />
      </svg>

      {/* Subtle horizontal glow band where the sun rests */}
      <div className="splash-glow" />

      {/* List under the sun — 3 strokes with a mint-deep check on row 1.
         Same composition as the app icon, so the splash "lands" on the
         identity. Strokes rendered as a single SVG centred on the screen. */}
      <svg
        className="splash-list"
        width="240"
        height="140"
        viewBox="0 0 240 140"
      >
        {/* Row 1: check + ink-80 stroke */}
        <path
          className="splash-list-check"
          d="M 4 22 L 18 36 L 40 12"
          stroke="#3f8a5e"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          className="splash-list-row splash-list-row-1"
          x="56"
          y="20"
          width="120"
          height="6"
          rx="3"
          fill="#2d2620"
          fillOpacity="0.82"
        />
        {/* Row 2 */}
        <rect
          className="splash-list-row splash-list-row-2"
          x="6"
          y="60"
          width="170"
          height="6"
          rx="3"
          fill="#2d2620"
          fillOpacity="0.38"
        />
        {/* Row 3 (shorter) */}
        <rect
          className="splash-list-row splash-list-row-3"
          x="6"
          y="100"
          width="110"
          height="6"
          rx="3"
          fill="#2d2620"
          fillOpacity="0.38"
        />
      </svg>

      <style>{`
        .splash-sky {
          position: absolute; inset: 0; pointer-events: none;
        }
        .splash-sky--night {
          background: linear-gradient(180deg, #1a1230 0%, #2a1d4a 50%, #4a2755 100%);
          animation: splash-night 2200ms ease-out forwards;
        }
        .splash-sky--dawn {
          background: linear-gradient(180deg, #5b3164 0%, #c46e7d 45%, #f4a787 90%, #fadfa8 100%);
          opacity: 0;
          animation: splash-dawn 2200ms ease-out forwards;
        }
        .splash-sky--day {
          background: linear-gradient(180deg, #f4a787 0%, #f5c563 55%, #fadfa8 100%);
          opacity: 0;
          animation: splash-day 2200ms ease-out forwards;
        }

        .splash-halo {
          position: absolute;
          left: 50%; top: 50%;
          width: 480px; height: 480px;
          margin-left: -240px; margin-top: -240px;
          border-radius: 50%;
          background: radial-gradient(closest-side, rgba(255,245,214,0.55), rgba(255,245,214,0) 70%);
          filter: blur(24px);
          opacity: 0;
          animation: splash-halo 2200ms ease-out forwards;
        }

        .splash-sun {
          position: absolute;
          left: 50%; top: 50%;
          margin-left: -100px; margin-top: -180px;
          transform: translateY(180px);
          opacity: 0;
          animation: splash-sun 2200ms cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }

        /* Faint horizontal "horizon glow" stripe across the centre */
        .splash-glow {
          position: absolute;
          left: 0; right: 0;
          top: 50%;
          height: 80px;
          margin-top: -40px;
          background: linear-gradient(180deg,
            rgba(255,250,242,0) 0%,
            rgba(255,250,242,0.18) 40%,
            rgba(255,250,242,0.18) 60%,
            rgba(255,250,242,0) 100%);
          opacity: 0;
          animation: splash-glow 2200ms ease-out forwards;
          filter: blur(12px);
          pointer-events: none;
        }

        /* List sits below the sun's resting position */
        .splash-list {
          position: absolute;
          left: 50%; top: 50%;
          margin-left: -120px;
          margin-top: 50px;
          opacity: 1;
        }
        .splash-list-row {
          opacity: 0;
          transform: translateY(8px);
        }
        .splash-list-row-1 {
          animation: splash-list-row 500ms var(--ease-out) 1700ms forwards;
        }
        .splash-list-row-2 {
          animation: splash-list-row 500ms var(--ease-out) 1780ms forwards;
        }
        .splash-list-row-3 {
          animation: splash-list-row 500ms var(--ease-out) 1860ms forwards;
        }
        .splash-list-check {
          opacity: 0;
          transform-origin: 22px 22px;
          transform: scale(0.6);
          animation: splash-list-check 320ms var(--ease-out) 1980ms forwards;
        }

        @keyframes splash-night {
          0%, 18% { opacity: 1; }
          40% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes splash-dawn {
          0%, 18% { opacity: 0; }
          40% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes splash-day {
          0%, 70% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes splash-halo {
          0%, 30% { opacity: 0; transform: scale(0.7); }
          75% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes splash-sun {
          0%, 28% { opacity: 0; transform: translateY(180px) scale(0.85); }
          70% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splash-glow {
          0%, 28% { opacity: 0; }
          75% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes splash-list-row {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-list-check {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

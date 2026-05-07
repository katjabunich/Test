"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "dela.splashShown";

/** Cinematic sunrise splash. Three full-screen sky layers cross-fade
   through dawn colours (deep dusk → pink dawn → warm peach), the sun
   lifts from below, then everything fades into the app. ~1.5s, once
   per session. */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    const t1 = setTimeout(() => setPhase("out"), 1450);
    const t2 = setTimeout(() => setPhase("gone"), 1900);
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
        animation: phase === "out" ? "splash-out 440ms var(--ease-out) forwards" : "none",
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

      {/* Subtle horizontal glow band where the sun crosses the centre line */}
      <div className="splash-glow" />

      <style>{`
        .splash-sky {
          position: absolute; inset: 0; pointer-events: none;
        }
        .splash-sky--night {
          background: linear-gradient(180deg, #1a1230 0%, #2a1d4a 50%, #4a2755 100%);
          animation: splash-night 1450ms ease-out forwards;
        }
        .splash-sky--dawn {
          background: linear-gradient(180deg, #5b3164 0%, #c46e7d 45%, #f4a787 90%, #fadfa8 100%);
          opacity: 0;
          animation: splash-dawn 1450ms ease-out forwards;
        }
        .splash-sky--day {
          background: linear-gradient(180deg, #f4a787 0%, #f5c563 55%, #fadfa8 100%);
          opacity: 0;
          animation: splash-day 1450ms ease-out forwards;
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
          animation: splash-halo 1450ms ease-out forwards;
        }

        .splash-sun {
          position: absolute;
          left: 50%; top: 50%;
          margin-left: -100px; margin-top: -100px;
          transform: translateY(180px);
          opacity: 0;
          animation: splash-sun 1450ms cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* A faint horizontal "horizon glow" stripe across the centre */
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
          animation: splash-glow 1450ms ease-out forwards;
          filter: blur(12px);
          pointer-events: none;
        }

        @keyframes splash-night {
          0%, 22% { opacity: 1; }
          42% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes splash-dawn {
          0%, 22% { opacity: 0; }
          42% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes splash-day {
          0%, 70% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes splash-halo {
          0%, 35% { opacity: 0; transform: scale(0.7); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes splash-sun {
          0%, 35% { opacity: 0; transform: translateY(180px) scale(0.85); }
          70% { opacity: 1; transform: translateY(40px) scale(1); }
          100% { opacity: 1; transform: translateY(-10px) scale(1); }
        }
        @keyframes splash-glow {
          0%, 30% { opacity: 0; }
          80% { opacity: 1; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

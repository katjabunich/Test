"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "dela.splashShown";

/** Brief splash that appears once per session (sticks to PWA cold-launches
    on iOS too). Logo scale-bounce + ring draw, then fades to the app. */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    const t1 = setTimeout(() => setPhase("out"), 850);
    const t2 = setTimeout(() => setPhase("gone"), 1300);
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
        background: "var(--paper)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: phase === "out" ? "splash-out 420ms var(--ease-out) forwards" : "none",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 96,
          height: 96,
          animation: "splash-in 700ms var(--ease-spring) both",
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          aria-hidden
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="splash-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#86c79a" />
              <stop offset="100%" stopColor="#4f9c6a" />
            </linearGradient>
          </defs>
          <rect
            x="4"
            y="4"
            width="88"
            height="88"
            rx="22"
            ry="22"
            fill="url(#splash-grad)"
          />
          <path
            d="M30 50 L42 62 L66 36"
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="70"
            style={{ animation: "splash-ring-in 600ms 200ms var(--ease-out) both" }}
          />
        </svg>
      </div>
    </div>
  );
}

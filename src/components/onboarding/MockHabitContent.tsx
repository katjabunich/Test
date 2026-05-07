"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";

const MINT = "#86c79a";

/** Today-screen mock zoomed in on a single habit ring filling 0 → 100%
   on mount. The slide wrapper fires confetti separately so it spills
   outside the phone. */
export default function MockHabitContent() {
  const [progress, setProgress] = useState(0);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(1), 320);
    const t2 = setTimeout(() => setFilled(true), 1450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div style={{ padding: "8px 14px 0", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
          marginBottom: 4,
        }}
      >
        вторник, 6 мая
      </div>
      <div
        style={{
          fontFamily: "var(--font-emphasis)",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.06,
          color: "var(--ink)",
        }}
      >
        Доброе утро<span style={{ color: "var(--mint-deep)" }}>.</span>
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
          marginTop: 24,
          marginBottom: 14,
        }}
      >
        Привычки сегодня
      </div>

      {/* Big ring + label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <BigRing progress={progress} filled={filled} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            Пить воду
          </span>
          <span
            className="tnum"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--mint-deep)",
              transition: "color 320ms",
              letterSpacing: "-0.005em",
            }}
          >
            {filled ? "7 дней подряд" : "6 дней подряд"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BigRing({
  progress,
  filled,
}: {
  progress: number;
  filled: boolean;
}) {
  const size = 110;
  const stroke = 4;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink-10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={MINT}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1100ms var(--ease-out)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 12,
          borderRadius: "50%",
          background: filled ? MINT : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: filled ? "var(--ink)" : MINT,
          transition: "background 320ms var(--ease-out)",
          transform: filled ? "scale(1.04)" : "scale(1)",
        }}
      >
        {filled ? (
          <span className="check-pop" style={{ display: "inline-flex" }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17L19 7.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <Icons.Drop size={42} stroke="currentColor" strokeWidth={2} />
        )}
      </div>
    </div>
  );
}

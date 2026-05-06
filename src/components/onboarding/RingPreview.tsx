"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";
import { fireConfetti } from "@/lib/celebrate";

const SIZE = 130;
const STROKE = 4;
const R = (SIZE - STROKE * 2) / 2;
const C = 2 * Math.PI * R;

/** Single large habit ring that animates 0 → 100% on mount, then the
   inner disk fills mint and a small confetti burst fires. */
export default function RingPreview() {
  const [progress, setProgress] = useState(0);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    // Trigger arc animation just after mount
    const t1 = setTimeout(() => setProgress(1), 260);
    // Once arc completes, fill the disk + celebrate
    const t2 = setTimeout(() => {
      setFilled(true);
      void fireConfetti("#86c79a");
    }, 1450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        margin: "0 auto",
        animation: "splash-in 380ms 200ms var(--ease-spring) both",
      }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--ink-10)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--mint)"
          strokeWidth={STROKE}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1100ms var(--ease-out)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: "50%",
          background: filled ? "var(--mint)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 320ms var(--ease-out)",
          color: filled ? "var(--ink)" : "var(--mint-deep)",
          transform: filled ? "scale(1.04)" : "scale(1)",
        }}
      >
        <span style={{ display: filled ? "none" : "inline-flex" }}>
          <Icons.Drop size={48} stroke="currentColor" strokeWidth={2} />
        </span>
        <span
          className={filled ? "check-pop" : ""}
          style={{
            display: filled ? "inline-flex" : "none",
            color: "var(--ink)",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5L10 17L19 7.5"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

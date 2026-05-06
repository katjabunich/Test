"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";

const STORAGE_KEY = "dela.onboarded.v1";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "ПРИВЕТ",
    title: "Я помогаю не теряться в делах",
    body: "Утром открываешь — сразу видишь, что нужно сегодня. Без вкладок и поиска.",
    visual: <CheckHero />,
  },
  {
    eyebrow: "СФЕРЫ",
    title: "Раздели жизнь по областям",
    body: "Работа, дом, твой канал, голландский — у каждой свой цвет. Сразу видно, что куда.",
    visual: <SpheresHero />,
  },
  {
    eyebrow: "ПРИВЫЧКИ",
    title: "Кольца отмечаешь одним тапом",
    body: "Прогресс за неделю + стрик. Доходишь до 7, 30, 100 дней — будут конфетти.",
    visual: <RingsHero />,
  },
];

export default function Onboarding() {
  const [done, setDone] = useState(true); // Default true — only flip false after we read the flag, so we don't flash for returning users.
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setDone(false);
  }, []);

  if (done) return null;

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setExiting(true);
    setTimeout(() => setDone(true), 320);
  }

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--paper)",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        animation: exiting ? "splash-out 320ms var(--ease-out) forwards" : "none",
      }}
    >
      <div
        style={{
          padding: "20px 22px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={finish}
          className="tap mono lower"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ink-60)",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 8px",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          пропустить
        </button>
      </div>

      <div
        key={step}
        style={{
          flex: 1,
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          textAlign: "left",
          animation: "slide-in 380ms var(--ease-out) both",
        }}
      >
        <div style={{ marginBottom: 36, alignSelf: "center" }}>{slide.visual}</div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--mint-deep)",
            letterSpacing: "0.13em",
            marginBottom: 10,
          }}
        >
          {slide.eyebrow}
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--ink-display, var(--ink))",
            margin: 0,
            lineHeight: 1.12,
          }}
        >
          {slide.title}
        </h2>
        <p
          style={{
            marginTop: 14,
            fontSize: 15,
            color: "var(--ink-60)",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          {slide.body}
        </p>
      </div>

      <div
        style={{
          padding: "16px 22px calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? "var(--mint-deep)" : "var(--ink-20)",
                transition: "all 280ms var(--ease-out)",
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => (isLast ? finish() : setStep(step + 1))}
          className="tap"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 22px",
            borderRadius: 999,
            background: "var(--mint-deep)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 16px rgba(79,156,106,0.4)",
          }}
        >
          {isLast ? "Готова" : "Дальше"}
          <Icons.Chevron size={16} stroke="#fff" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/* ─── Visuals for each slide ─── */

function CheckHero() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
      <defs>
        <linearGradient id="ob-check" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86c79a" />
          <stop offset="100%" stopColor="#4f9c6a" />
        </linearGradient>
      </defs>
      <circle
        cx="80"
        cy="80"
        r="64"
        fill="rgba(134,199,154,0.15)"
        stroke="rgba(79,156,106,0.3)"
        strokeWidth="1.2"
      />
      <circle cx="80" cy="80" r="44" fill="url(#ob-check)" />
      <path
        d="M58 82 L74 96 L104 64"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpheresHero() {
  const items = [
    { color: "#f3a78b" },
    { color: "#f5c563" },
    { color: "#86c79a" },
    { color: "#7d96a8" },
    { color: "#b5a3df" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 280,
      }}
    >
      {items.map((s, i) => (
        <div
          key={i}
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: s.color,
            transform: `rotate(${(i - 2) * 4}deg)`,
            boxShadow: "0 4px 12px rgba(45,38,32,0.06)",
            animation: `slide-in ${400 + i * 60}ms var(--ease-out) both`,
          }}
        />
      ))}
    </div>
  );
}

function RingsHero() {
  const items = [
    { color: "#86c79a", progress: 0.85, fill: true },
    { color: "#7d96a8", progress: 0.7, fill: true },
    { color: "#f3a78b", progress: 0.3, fill: false },
    { color: "#b5a3df", progress: 1.0, fill: false },
  ];
  const size = 56;
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: size,
            height: size,
            animation: `slide-in ${400 + i * 80}ms var(--ease-out) both`,
          }}
        >
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
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
              stroke={it.color}
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - it.progress)}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: "50%",
              background: it.fill ? it.color : "transparent",
            }}
          />
        </div>
      ))}
    </div>
  );
}

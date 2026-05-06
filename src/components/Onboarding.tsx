"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";
import HeroPreview from "@/components/onboarding/HeroPreview";
import SpheresPreview from "@/components/onboarding/SpheresPreview";
import RingPreview from "@/components/onboarding/RingPreview";

const STORAGE_KEY = "dela.onboarded.v1";

type Slide = {
  eyebrow: string;
  title: string;     // Title text WITHOUT the trailing period — the period is the mint accent
  body: string;
  cta: string;
  visual: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "ПЕРВЫЙ ВЗГЛЯД",
    title: "Доброе утро",
    body: "Открываешь утром — и сразу видно, что делать сегодня. Без вкладок и поиска.",
    cta: "Дальше",
    visual: <HeroPreview />,
  },
  {
    eyebrow: "КАК ЭТО УСТРОЕНО",
    title: "Своя жизнь по сферам",
    body: "Работа, дом, канал, голландский, AI — у каждой свой цвет. Сразу видно, что относится к чему.",
    cta: "Дальше",
    visual: <SpheresPreview />,
  },
  {
    eyebrow: "ЕЖЕДНЕВНЫЙ РИТМ",
    title: "7 дней подряд — праздник",
    body: "Тап по кольцу — отметила. Дойдёшь до 7, 30, 100 дней — будут конфетти.",
    cta: "Готова, поехали",
    visual: <RingPreview />,
  },
];

export default function Onboarding() {
  const [done, setDone] = useState(true);
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
        overflow: "hidden",
      }}
    >
      {/* Soft mint wash in the top-right corner — same warmth as the app */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(134,199,154,0.22), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* And a subtle peach in bottom-left, balancing it */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -160,
          left: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(243,167,139,0.16), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top bar: pagination indicator + skip */}
      <div
        style={{
          padding: "20px 22px 0",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 28 : 8,
                height: 4,
                borderRadius: 2,
                background:
                  i === step ? "var(--mint-deep)" : "var(--ink-20)",
                transition: "all 320ms var(--ease-spring)",
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={finish}
          className="tap mono lower"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ink-60)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 8px",
            cursor: "pointer",
            letterSpacing: "0.13em",
            textTransform: "uppercase",
          }}
        >
          Пропустить
        </button>
      </div>

      {/* Slide content */}
      <div
        key={step}
        style={{
          flex: 1,
          padding: "32px 28px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          minHeight: 0,
          position: "relative",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--mint-deep)",
            letterSpacing: "0.14em",
            marginBottom: 12,
            opacity: 0,
            animation: "slide-in 360ms 60ms var(--ease-out) forwards",
          }}
        >
          {slide.eyebrow}
        </div>

        <h2
          aria-label={`${slide.title}.`}
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.032em",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: 0,
            marginBottom: 28,
          }}
        >
          <StaggeredHeading text={slide.title} />
          <span style={{ color: "var(--mint-deep)" }}>.</span>
        </h2>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          {slide.visual}
        </div>

        <p
          style={{
            fontSize: 15,
            color: "var(--ink-60)",
            lineHeight: 1.55,
            letterSpacing: "-0.005em",
            margin: "28px 0 0",
            opacity: 0,
            animation: "slide-in 380ms 700ms var(--ease-out) forwards",
            maxWidth: 360,
          }}
        >
          {slide.body}
        </p>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: "20px 22px calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "flex-end",
          position: "relative",
        }}
      >
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
            opacity: 0,
            animation: "slide-in 360ms 900ms var(--ease-out) forwards",
          }}
        >
          {slide.cta}
          <Icons.Chevron size={16} stroke="#fff" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/** Renders a string with each character (or word, if text is long) as a
   span with a staggered animation-delay. Caps total animation at ~600ms
   so longer titles still feel snappy. */
function StaggeredHeading({ text }: { text: string }) {
  const chars = Array.from(text);
  const stepMs = chars.length > 18 ? 18 : 28;
  return (
    <>
      {chars.map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            opacity: 0,
            animation: `text-stagger-in 360ms ${i * stepMs}ms var(--ease-out) forwards`,
          }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

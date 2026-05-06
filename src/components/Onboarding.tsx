"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icons } from "@/components/Icons";
import HeroPreview from "@/components/onboarding/HeroPreview";
import SpheresPreview from "@/components/onboarding/SpheresPreview";
import RingPreview from "@/components/onboarding/RingPreview";
import SlideBackground from "@/components/onboarding/SlideBackground";
import FloatingDecor from "@/components/onboarding/FloatingDecor";

const STORAGE_KEY = "dela.onboarded.v1";

type Slide = {
  eyebrow: string;
  eyebrowDot: string;     // sphere-style colour dot before the eyebrow
  title: string;
  body: string;
  cta: string;
  visual: React.ReactNode;
  tilt: number;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Первый взгляд",
    eyebrowDot: "#f5c563",
    title: "Доброе утро",
    body: "Открываешь утром — и сразу видно, что делать сегодня. Без вкладок и поиска.",
    cta: "Дальше",
    visual: <HeroPreview />,
    tilt: -4,
  },
  {
    eyebrow: "Как это устроено",
    eyebrowDot: "#86c79a",
    title: "Своя жизнь по сферам",
    body: "Работа, дом, канал, голландский, AI — у каждой свой цвет. Сразу видно, что относится к чему.",
    cta: "Дальше",
    visual: <SpheresPreview />,
    tilt: 3,
  },
  {
    eyebrow: "Ежедневный ритм",
    eyebrowDot: "#b5a3df",
    title: "7 дней подряд — праздник",
    body: "Тап по кольцу — отметила. Дойдёшь до 7, 30, 100 дней — будут конфетти.",
    cta: "Готова, поехали",
    visual: <RingPreview />,
    tilt: -3,
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
      {/* Vivid mesh background per slide — re-mounts on step change so its
         crossfade re-fires. */}
      <div
        key={`bg-${step}`}
        style={{
          position: "absolute",
          inset: 0,
          animation: "slide-in 600ms var(--ease-out) both",
        }}
      >
        <SlideBackground variant={step as 0 | 1 | 2} />
      </div>

      {/* Top bar: pagination + skip */}
      <div
        style={{
          padding: "20px 22px 0",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
          flexShrink: 0,
          zIndex: 2,
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
          className="tap"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ink-60)",
            fontSize: 14,
            fontWeight: 500,
            padding: "4px 8px",
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          пропустить
        </button>
      </div>

      {/* Phone stage with floating decor */}
      <PhoneStage step={step} variant={step as 0 | 1 | 2}>
        {slide.visual}
      </PhoneStage>

      {/* Text */}
      <div
        style={{
          padding: "0 28px 0",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
        key={`text-${step}`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            opacity: 0,
            animation: "slide-in 360ms 80ms var(--ease-out) forwards",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: slide.eyebrowDot,
              boxShadow: `0 0 0 3px ${slide.eyebrowDot}33`,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {slide.eyebrow}
          </span>
        </div>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.032em",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: 0,
            marginBottom: 12,
            opacity: 0,
            animation: "slide-in 460ms 200ms var(--ease-out) forwards",
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {slide.title}
          <span style={{ color: "var(--mint-deep)" }}>.</span>
        </h2>
        <p
          style={{
            fontSize: 15.5,
            color: "var(--ink-80)",
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
            margin: 0,
            opacity: 0,
            animation: "slide-in 420ms 380ms var(--ease-out) forwards",
            maxWidth: 380,
          }}
        >
          {slide.body}
        </p>
      </div>

      <div
        style={{
          padding: "20px 22px calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "flex-end",
          position: "relative",
          flexShrink: 0,
          zIndex: 2,
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
            padding: "14px 24px",
            borderRadius: 999,
            background: "var(--mint-deep)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            boxShadow:
              "0 6px 16px rgba(79,156,106,0.4), 0 1px 0 rgba(255,255,255,0.25) inset",
          }}
        >
          {slide.cta}
          <Icons.Chevron size={16} stroke="#fff" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/** Wraps the phone visual in a scaled stage and overlays floating decor.
   The fixed-pixel 220×475 PhoneFrame fits any viewport via this scale. */
function PhoneStage({
  children,
  step,
  variant,
}: {
  children: React.ReactNode;
  step: number;
  variant: 0 | 1 | 2;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const targetW = 250; // a bit of margin for floating decor + tilt
      const targetH = 500;
      const s = Math.min(1, rect.width / targetW, rect.height / targetH);
      setScale(s);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 0",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        key={`phone-${step}`}
        style={{
          position: "relative",
          width: 250 * scale,
          height: 500 * scale,
          animation: "splash-in 540ms var(--ease-spring) both",
        }}
      >
        {/* Floating decor sits in the same scaled box as the phone so it
           tracks together. Decor positions are percentages relative to
           this container. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {/* Phone is centred inside this 250×500 box */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {children}
          </div>
          <FloatingDecor variant={variant} />
        </div>
      </div>
      <style>{`
        @keyframes decor-float {
          0%   { transform: translateY(0)   var(--decor-rot, rotate(0deg)); }
          100% { transform: translateY(-6px) var(--decor-rot, rotate(0deg)); }
        }
      `}</style>
    </div>
  );
}

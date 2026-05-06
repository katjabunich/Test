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
  eyebrowDot: string;
  title: string;
  body: string;
  cta: string;
  visual: React.ReactNode;
  /** Halo colour behind the phone — sphere accent of the slide. */
  glow: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Первый взгляд",
    eyebrowDot: "#f5c563",
    title: "Доброе утро",
    body: "Открываешь утром — и сразу видно, что делать сегодня. Без вкладок и поиска.",
    cta: "Дальше",
    visual: <HeroPreview />,
    glow: "#f5c563",
  },
  {
    eyebrow: "Как это устроено",
    eyebrowDot: "#86c79a",
    title: "Своя жизнь по сферам",
    body: "Работа, дом, канал, голландский, AI — у каждой свой цвет. Сразу видно, что относится к чему.",
    cta: "Дальше",
    visual: <SpheresPreview />,
    glow: "#86c79a",
  },
  {
    eyebrow: "Ежедневный ритм",
    eyebrowDot: "#b5a3df",
    title: "7 дней подряд — праздник",
    body: "Тап по кольцу — отметила. Дойдёшь до 7, 30, 100 дней — будут конфетти.",
    cta: "Готова, поехали",
    visual: <RingPreview />,
    glow: "#b5a3df",
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
  const progress = (step + 1) / SLIDES.length;

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
      {/* Background blobs (per-slide) */}
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

      {/* Top bar — thread progress + skip */}
      <div
        style={{
          padding: "20px 22px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        {/* Thread track */}
        <div
          style={{
            flex: 1,
            height: 2.5,
            background: "rgba(45,38,32,0.10)",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background:
                "linear-gradient(90deg, var(--mint-deep), #14CAC4)",
              borderRadius: 2,
              transition: "width 540ms var(--ease-spring)",
              boxShadow: "0 0 6px rgba(79,156,106,0.45)",
            }}
          />
        </div>
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
            flexShrink: 0,
          }}
        >
          пропустить
        </button>
      </div>

      {/* Phone stage with glow + decor */}
      <PhoneStage
        step={step}
        variant={step as 0 | 1 | 2}
        glow={slide.glow}
      >
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

/** Hosts the 3D-rotated phone, a coloured halo behind it, and floating
   decoration around it. The phone itself sits inside a sway-animated
   wrapper so it gently floats without disturbing its perspective. */
function PhoneStage({
  children,
  step,
  variant,
  glow,
}: {
  children: React.ReactNode;
  step: number;
  variant: 0 | 1 | 2;
  glow: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const targetW = 280;
      const targetH = 540;
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
        key={`stage-${step}`}
        style={{
          position: "relative",
          width: 280 * scale,
          height: 540 * scale,
          animation: "splash-in 540ms var(--ease-spring) both",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {/* Halo behind phone */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 360,
              height: 480,
              transform: "translate(-50%, -45%)",
              background: `radial-gradient(closest-side, ${glow} 0%, transparent 70%)`,
              filter: "blur(46px)",
              opacity: 0.55,
              pointerEvents: "none",
              zIndex: 0,
              animation: "slide-in 700ms 100ms var(--ease-out) both",
            }}
          />

          {/* Phone, centred, floating with subtle sway */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "phone-sway 8s ease-in-out infinite",
              zIndex: 1,
            }}
          >
            {children}
          </div>

          {/* Floating chips/badges (flat, on top, do not rotate with phone) */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
            <FloatingDecor variant={variant} />
          </div>
        </div>
      </div>
    </div>
  );
}

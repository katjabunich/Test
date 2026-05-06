"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icons } from "@/components/Icons";
import HeroPreview from "@/components/onboarding/HeroPreview";
import SpheresPreview from "@/components/onboarding/SpheresPreview";
import RingPreview from "@/components/onboarding/RingPreview";
import SlideBackground from "@/components/onboarding/SlideBackground";
import FloatingDecor from "@/components/onboarding/FloatingDecor";

const STORAGE_KEY = "dela.onboarded.v1";

/** Nominal stage canvas — all decoration percentages are in this space.
   The stage is then proportionally scaled down to fit the device. */
const STAGE_W = 280;
const STAGE_H = 510;

type Slide = {
  eyebrow: string;
  eyebrowDot: string;
  title: string;
  body: string;
  cta: string;
  visual: React.ReactNode;
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
      {/* Background blobs */}
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

      {/* Top bar — thread + skip — respects status bar */}
      <div
        style={{
          padding: "max(12px, calc(env(safe-area-inset-top) + 6px)) 22px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          flexShrink: 0,
          zIndex: 3,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 2.5,
            background: "rgba(45,38,32,0.10)",
            borderRadius: 2,
            overflow: "hidden",
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

      {/* Phone stage */}
      <PhoneStage step={step} variant={step as 0 | 1 | 2} glow={slide.glow}>
        {slide.visual}
      </PhoneStage>

      {/* Text */}
      <div
        style={{
          padding: "0 26px",
          flexShrink: 0,
          position: "relative",
          zIndex: 3,
        }}
        key={`text-${step}`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
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
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12.5,
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
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            color: "var(--ink)",
            margin: "0 0 10px",
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
            fontSize: 14.5,
            color: "var(--ink-80)",
            lineHeight: 1.45,
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

      {/* CTA */}
      <div
        style={{
          padding: "16px 22px max(18px, calc(env(safe-area-inset-bottom) + 14px))",
          display: "flex",
          justifyContent: "flex-end",
          position: "relative",
          flexShrink: 0,
          zIndex: 3,
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

/** Stage holds: halo behind, 3D-rotated phone with sway, floating decor.
   Layout box reserves the scaled footprint; visual canvas renders at
   nominal size and is scaled into that footprint. Each layer is properly
   nested so transform animations don't override positioning. */
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
      // Allow a bit of margin so tilt + decor edges don't kiss the bounds.
      const usableW = Math.max(0, rect.width - 8);
      const usableH = Math.max(0, rect.height - 8);
      const s = Math.min(1, usableW / STAGE_W, usableH / STAGE_H);
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
        padding: 0,
        position: "relative",
        zIndex: 2,
        overflow: "hidden",
      }}
    >
      {/* Layout footprint sized to scaled stage */}
      <div
        style={{
          width: STAGE_W * scale,
          height: STAGE_H * scale,
          position: "relative",
        }}
      >
        {/* Visual canvas at nominal size, scaled into the layout box */}
        <div
          key={`stage-${step}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            animation: "splash-in 540ms var(--ease-spring) both",
          }}
        >
          {/* Halo behind phone */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 340,
              height: 460,
              transform: "translate(-50%, -45%)",
              background: `radial-gradient(closest-side, ${glow} 0%, transparent 70%)`,
              filter: "blur(48px)",
              opacity: 0.55,
              pointerEvents: "none",
              zIndex: 0,
              animation: "slide-in 700ms 100ms var(--ease-out) both",
            }}
          />

          {/* Phone — centred, with sway nested inside the centring wrapper */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                animation: "phone-sway 8s ease-in-out infinite",
              }}
            >
              {children}
            </div>
          </div>

          {/* Floating decor on top, flat (does not rotate with the phone) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <FloatingDecor variant={variant} />
          </div>
        </div>
      </div>
    </div>
  );
}

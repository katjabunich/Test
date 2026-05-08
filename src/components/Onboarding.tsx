"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "dela.onboarded.v1";

type Slide = {
  illustration: string;
  alt: string;
  title: string;
  body: React.ReactNode;
  cta: string;
  /** Vertical anchor for `object-fit: cover`. 0% = top, 100% = bottom.
      Tune per-image so the protagonist isn't clipped by the bottom card. */
  focus: string;
};

const SLIDES: Slide[] = [
  {
    illustration: "/illustrations/onboarding-morning.jpg",
    alt: "Утро у окна с восходом, кофе и блокнотом",
    title: "Утро без хаоса",
    body: (
      <>
        На <span className="mark-butter">одном экране</span> всё, что нужно
        сделать сегодня.
      </>
    ),
    cta: "Дальше",
    focus: "center 75%",
  },
  {
    illustration: "/illustrations/onboarding-spheres.jpg",
    alt: "Уютный момент с дневником и закладками разных цветов",
    title: "Сферы жизни",
    body: (
      <>
        Работа, дом, отдых — у каждой{" "}
        <span className="mark-butter">свой цвет</span>.
      </>
    ),
    cta: "Дальше",
    focus: "center 35%",
  },
  {
    illustration: "/illustrations/onboarding-streak.jpg",
    alt: "Девушка бежит по тропе, цепочка следов уходит назад",
    title: "День за днём",
    body: (
      <>
        Привычки растут страйком — <span className="mark-butter">день за днём</span>.
      </>
    ),
    cta: "Готова, поехали",
    focus: "center 60%",
  },
];

export default function Onboarding() {
  const [done, setDone] = useState(true);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);

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

  function goNext() {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else finish();
  }
  function goPrev() {
    if (step > 0) setStep(step - 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!swipeStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    const dt = Date.now() - swipeStart.current.t;
    swipeStart.current = null;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < 50) return;
    if (dt > 600) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  const slide = SLIDES[step];

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
      {/* Skip button — top-right, no back chevron, no progress thread */}
      <div
        style={{
          position: "absolute",
          top: "max(14px, calc(env(safe-area-inset-top) + 8px))",
          right: 18,
          zIndex: 4,
        }}
      >
        <button
          type="button"
          onClick={finish}
          className="tap"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "none",
            color: "var(--ink-60)",
            fontSize: 13,
            fontWeight: 500,
            padding: "7px 12px",
            borderRadius: 14,
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          Пропустить
        </button>
      </div>

      {/* Full-bleed illustration — fills the upper portion of the screen.
         object-fit: cover keeps the protagonist centered as aspect ratios
         shift between phone sizes. */}
      <div
        key={`illu-${step}`}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          width: "100%",
          animation: "slide-in 540ms var(--ease-out) both",
        }}
      >
        <Image
          src={slide.illustration}
          alt={slide.alt}
          fill
          priority={step === 0}
          sizes="(max-width: 460px) 100vw, 460px"
          style={{
            objectFit: "cover",
            objectPosition: slide.focus,
          }}
        />
      </div>

      {/* Bottom card — slightly overlaps illustration via negative margin
         to give depth, like Verbivy/CircleUp references. */}
      <div
        key={`card-${step}`}
        style={{
          background: "var(--paper)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding:
            "22px 26px max(22px, calc(env(safe-area-inset-bottom) + 18px))",
          marginTop: -18,
          position: "relative",
          zIndex: 3,
          flexShrink: 0,
          boxShadow: "0 -10px 30px rgba(45,38,32,0.08)",
          animation: "slide-in 460ms 80ms var(--ease-out) both",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "var(--paper-deep)",
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          <span
            className="tnum"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-60)",
              letterSpacing: 0,
            }}
          >
            {step + 1} / {SLIDES.length}
          </span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-emphasis)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            color: "var(--ink)",
            margin: "0 0 10px",
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {slide.title}
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--ink-80)",
            lineHeight: 1.45,
            letterSpacing: "-0.005em",
            margin: "0 0 18px",
          }}
        >
          {slide.body}
        </p>

        {/* Pagination dots */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 18,
            alignItems: "center",
          }}
        >
          {SLIDES.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? "var(--ink-strong)" : "var(--ink-20)",
                transition: "width 280ms var(--ease-out), background 280ms var(--ease-out)",
              }}
            />
          ))}
        </div>

        {/* CTA — full-width ink-strong button */}
        <button
          type="button"
          onClick={goNext}
          className="tap"
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 16,
            background: "var(--ink-strong)",
            color: "var(--paper)",
            border: "none",
            cursor: "pointer",
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            boxShadow: "0 6px 16px rgba(31,24,19,0.28)",
          }}
        >
          {slide.cta}
        </button>

        {step > 0 && (
          <button
            type="button"
            onClick={goPrev}
            className="tap"
            style={{
              width: "100%",
              padding: "10px 0 0",
              background: "transparent",
              color: "var(--ink-40)",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            Назад
          </button>
        )}
      </div>
    </div>
  );
}

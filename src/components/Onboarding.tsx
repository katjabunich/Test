"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useT, useLang, useSetLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";

const STORAGE_KEY = "dela.onboarded.v1";

const SLIDES = [
  { num: 1, illustration: "/illustrations/onboarding-morning.jpg", focus: "center 95%" },
  { num: 2, illustration: "/illustrations/onboarding-spheres.jpg", focus: "center 35%" },
  { num: 3, illustration: "/illustrations/onboarding-streak.jpg",  focus: "center 60%" },
] as const;

export default function Onboarding() {
  const t = useT();
  const lang = useLang();
  const { setLang } = useSetLang();
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
  const n = slide.num;
  const title = t(`onb.s${n}_title`);
  const cta = t(`onb.s${n}_cta`);
  const pre = t(`onb.s${n}_pre`);
  const mark = t(`onb.s${n}_mark`);
  const post = t(`onb.s${n}_post`);

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
      {/* Top bar: language toggle + Skip */}
      <div
        style={{
          position: "absolute",
          top: "max(14px, calc(env(safe-area-inset-top) + 8px))",
          left: 18,
          right: 18,
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <LangToggle lang={lang} onChange={setLang} />
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
          {t("onb.skip")}
        </button>
      </div>

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
          alt={title}
          fill
          priority={step === 0}
          sizes="(max-width: 460px) 100vw, 460px"
          style={{
            objectFit: "cover",
            objectPosition: slide.focus,
          }}
        />
      </div>

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
          {title}
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
          {pre}
          <span className="mark-butter">{mark}</span>
          {post}
        </p>

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
          {cta}
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
            {t("onb.back")}
          </button>
        )}
      </div>
    </div>
  );
}

function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Language"
      style={{
        display: "inline-flex",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 14,
        padding: 3,
        gap: 2,
      }}
    >
      {(["ru", "en"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className="tap"
            aria-pressed={active}
            style={{
              border: "none",
              background: active ? "var(--paper)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-60)",
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 11,
              cursor: "pointer",
              letterSpacing: "0.04em",
              boxShadow: active ? "0 1px 3px rgba(45,38,32,0.12)" : "none",
              transition: "background 200ms var(--ease-out), color 200ms var(--ease-out)",
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

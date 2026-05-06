"use client";

import { Icons } from "@/components/Icons";

/** Floating UI fragments around the phone. Each item is wrapped in two
   divs: outer for static rotation + position, inner for the breathing
   animation. Positioned so chips graze the bezel rather than covering
   the phone's screen content. */
export default function FloatingDecor({ variant }: { variant: 0 | 1 | 2 }) {
  if (variant === 0) {
    // Slide 1 — concept chip about "complete by tap"
    return (
      <Floating
        rotation={6}
        style={{ top: "26%", right: "-14%" }}
        delay={0}
        enterDelay={520}
      >
        <Pill background="rgba(255,255,255,0.92)" borderColor="#f5c563">
          <Icons.Check size={12} stroke="#0f742d" strokeWidth={2.6} />
          <span style={{ fontWeight: 600 }}>1 тап</span>
        </Pill>
      </Floating>
    );
  }

  if (variant === 1) {
    return (
      <>
        {/* Top-right: palette chip — 5 dots + "5 цветов" */}
        <Floating
          rotation={5}
          style={{ top: "14%", right: "-14%" }}
          delay={0}
          enterDelay={520}
        >
          <Pill background="rgba(255,255,255,0.92)" borderColor="#86c79a">
            <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Dot color="#f3a78b" />
              <Dot color="#f5c563" />
              <Dot color="#86c79a" />
              <Dot color="#7d96a8" />
              <Dot color="#b5a3df" />
            </span>
            <span style={{ fontWeight: 600 }}>5 цветов</span>
          </Pill>
        </Floating>

        {/* Bottom-left: swipe hint */}
        <Floating
          rotation={-6}
          style={{ top: "70%", left: "-10%" }}
          delay={400}
          enterDelay={620}
        >
          <Pill background="rgba(255,255,255,0.92)" borderColor="#7d96a8">
            <Icons.Chevron
              size={12}
              stroke="var(--ink)"
              strokeWidth={2.4}
              style={{ transform: "rotate(180deg)" }}
            />
            <span style={{ fontWeight: 600 }}>свайп</span>
            <Icons.Chevron size={12} stroke="var(--ink)" strokeWidth={2.4} />
          </Pill>
        </Floating>
      </>
    );
  }

  // variant === 2 — celebration. Solid badges; pop-in entry to mirror confetti.
  return (
    <>
      <Floating
        rotation={8}
        style={{ top: "22%", right: "-14%" }}
        delay={1700}
        enterDelay={1100}
        popIn
      >
        <Badge label="+1 день" accent="#86c79a" />
      </Floating>
      <Floating
        rotation={-6}
        style={{ top: "70%", left: "-10%" }}
        delay={1900}
        enterDelay={1300}
        popIn
      >
        <Badge label="🎉 7 дней" accent="#b5a3df" />
      </Floating>
      <style>{`
        @keyframes decor-pop {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

function Floating({
  rotation,
  style,
  children,
  delay,
  enterDelay = 0,
  popIn,
}: {
  rotation: number;
  style: React.CSSProperties;
  children: React.ReactNode;
  delay: number;
  enterDelay?: number;
  popIn?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    >
      <div
        style={{
          opacity: 0,
          animation: popIn
            ? `decor-pop 600ms ${enterDelay}ms var(--ease-spring) both, decor-float 5s ${delay}ms ease-in-out infinite alternate`
            : `slide-in 460ms ${enterDelay}ms var(--ease-out) both, decor-float 5s ${delay + 460}ms ease-in-out infinite alternate`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Pill({
  children,
  background,
  borderColor,
}: {
  children: React.ReactNode;
  background: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 11px",
        borderRadius: 999,
        background,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1.5px solid ${borderColor}`,
        boxShadow: "0 8px 18px rgba(45,38,32,0.12)",
        whiteSpace: "nowrap",
        fontSize: 11.5,
        color: "var(--ink)",
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        background: color,
      }}
    />
  );
}

function Badge({ label, accent }: { label: string; accent: string }) {
  return (
    <div
      style={{
        padding: "6px 11px",
        borderRadius: 11,
        background: accent,
        boxShadow: "0 10px 22px rgba(45,38,32,0.16)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

"use client";

/** Floating accents around the phone. v1 had concept chips on every
   slide; user feedback said those felt arbitrary on slides 1 and 2 (they
   were UI-mechanic hints, not product features). Now decoration only
   appears on the celebration slide where it tells a story:
     "+1 день" pop-in (just earned today) and "🎉 7 дней" (the streak
     itself). Both pop-in to mirror the confetti firing from the phone. */
export default function FloatingDecor({ variant }: { variant: 0 | 1 | 2 }) {
  if (variant !== 2) return null;

  return (
    <>
      <Floating
        rotation={8}
        style={{ top: "22%", right: "-14%" }}
        delay={1700}
        enterDelay={1100}
      >
        <Badge label="+1 день" accent="#86c79a" />
      </Floating>
      <Floating
        rotation={-6}
        style={{ top: "70%", left: "-10%" }}
        delay={1900}
        enterDelay={1300}
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
  enterDelay,
}: {
  rotation: number;
  style: React.CSSProperties;
  children: React.ReactNode;
  delay: number;
  enterDelay: number;
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
          animation: `decor-pop 600ms ${enterDelay}ms var(--ease-spring) both, decor-float 5s ${delay}ms ease-in-out infinite alternate`,
        }}
      >
        {children}
      </div>
    </div>
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


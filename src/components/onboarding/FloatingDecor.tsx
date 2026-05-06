"use client";

import { Icons } from "@/components/Icons";

/** Floating UI fragments around the phone. Each item is wrapped in two
   divs: an outer one for static rotation + position, an inner one that
   runs the breathing animation. This keeps the rotation stable during
   the translateY keyframes. */
export default function FloatingDecor({ variant }: { variant: 0 | 1 | 2 }) {
  if (variant === 0) {
    return (
      <>
        <Floating
          rotation={-8}
          style={{ top: "62%", left: "4%" }}
          delay={0}
          enterDelay={520}
        >
          <Chip
            color="#f5c563"
            label="Канал"
            icon={<Icons.Video size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          />
        </Floating>
        <Floating
          rotation={6}
          style={{ top: "16%", right: "4%" }}
          delay={500}
          enterDelay={620}
        >
          <Badge label="Сделать" accent="#f5c563" />
        </Floating>
      </>
    );
  }
  if (variant === 1) {
    return (
      <>
        <Floating
          rotation={-6}
          style={{ top: "14%", left: "4%" }}
          delay={0}
          enterDelay={520}
        >
          <Chip
            color="#f3a78b"
            label="Работа"
            icon={<Icons.Briefcase size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          />
        </Floating>
        <Floating
          rotation={7}
          style={{ top: "70%", right: "4%" }}
          delay={400}
          enterDelay={620}
        >
          <Chip
            color="#7d96a8"
            label="Голландский"
            icon={<Icons.Globe size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          />
        </Floating>
        <Floating
          rotation={-10}
          style={{ top: "60%", left: "4%" }}
          delay={200}
          enterDelay={720}
        >
          <Chip
            color="#b5a3df"
            label="AI"
            icon={<Icons.Cpu size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          />
        </Floating>
      </>
    );
  }
  // variant === 2 — celebration
  return (
    <>
      <Floating
        rotation={8}
        style={{ top: "18%", right: "4%" }}
        delay={1700}
        enterDelay={1100}
        popIn
      >
        <Badge label="+1 день" accent="#86c79a" />
      </Floating>
      <Floating
        rotation={-6}
        style={{ top: "65%", left: "4%" }}
        delay={1900}
        enterDelay={1300}
        popIn
      >
        <Badge label="🎉 7 дней" accent="#b5a3df" />
      </Floating>
    </>
  );
}

/** Outer holds rotation + position; inner holds the bob animation +
   optional pop-in entry. Two layers so neither override each other. */
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
      <style>{`
        @keyframes decor-pop {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Chip({
  color,
  label,
  icon,
}: {
  color: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 11px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1.5px solid ${color}`,
        boxShadow: "0 8px 18px rgba(45,38,32,0.12)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          background: color,
        }}
      />
      {icon}
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
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

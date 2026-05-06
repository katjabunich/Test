"use client";

import { Icons } from "@/components/Icons";

/** Floating UI fragments around the phone — gives every slide more layers
   and life. Variant matches the slide. */
export default function FloatingDecor({
  variant,
}: {
  variant: 0 | 1 | 2;
}) {
  if (variant === 0) {
    return (
      <>
        <FloatingChip
          color="#f5c563"
          label="Канал"
          icon={<Icons.Video size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          style={{
            top: "62%",
            left: "8%",
            transform: "rotate(-8deg)",
            animation: "decor-float 5s ease-in-out infinite alternate",
          }}
        />
        <FloatingBadge
          label="Сделать"
          accent="#f5c563"
          style={{
            top: "18%",
            right: "8%",
            transform: "rotate(6deg)",
            animation: "decor-float 6s 0.5s ease-in-out infinite alternate",
          }}
        />
      </>
    );
  }
  if (variant === 1) {
    return (
      <>
        <FloatingChip
          color="#f3a78b"
          label="Работа"
          icon={<Icons.Briefcase size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          style={{
            top: "16%",
            left: "10%",
            transform: "rotate(-6deg)",
            animation: "decor-float 5s ease-in-out infinite alternate",
          }}
        />
        <FloatingChip
          color="#7d96a8"
          label="Голландский"
          icon={<Icons.Globe size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          style={{
            top: "70%",
            right: "8%",
            transform: "rotate(7deg)",
            animation: "decor-float 6s 0.4s ease-in-out infinite alternate",
          }}
        />
        <FloatingChip
          color="#b5a3df"
          label="AI"
          icon={<Icons.Cpu size={12} stroke="var(--ink)" strokeWidth={2.4} />}
          style={{
            top: "60%",
            left: "8%",
            transform: "rotate(-10deg)",
            animation: "decor-float 5.5s 0.2s ease-in-out infinite alternate",
          }}
        />
      </>
    );
  }
  // variant === 2 — celebration
  return (
    <>
      <FloatingBadge
        label="+1 день"
        accent="#86c79a"
        style={{
          top: "20%",
          right: "8%",
          transform: "rotate(8deg)",
          animation: "decor-pop 600ms 1100ms var(--ease-spring) both, decor-float 5s 1700ms ease-in-out infinite alternate",
        }}
      />
      <FloatingBadge
        label="🎉 7 дней"
        accent="#b5a3df"
        style={{
          top: "65%",
          left: "8%",
          transform: "rotate(-6deg)",
          animation: "decor-pop 600ms 1300ms var(--ease-spring) both, decor-float 5.5s 1900ms ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes decor-pop {
          0%   { opacity: 0; transform: scale(0.5) rotate(0deg); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

function FloatingChip({
  color,
  label,
  icon,
  style,
}: {
  color: string;
  label: string;
  icon: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1.5px solid ${color}`,
        boxShadow: "0 8px 18px rgba(45,38,32,0.10)",
        ...style,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: color,
        }}
      />
      {icon}
      <span
        style={{
          fontSize: 12,
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

function FloatingBadge({
  label,
  accent,
  style,
}: {
  label: string;
  accent: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        padding: "7px 12px",
        borderRadius: 12,
        background: accent,
        boxShadow: "0 10px 22px rgba(45,38,32,0.14)",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 12,
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

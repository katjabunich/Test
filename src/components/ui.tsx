import type { CSSProperties, ReactNode } from "react";

/* Small reusable inline-style primitives for the «Рассвет» (dawn) design
   language. Every screen-level agent should compose these instead of
   re-declaring card/pill/heading styles inline.

   Ground rules baked in here (see design brief, final section A2):
   - page background is warm cream (--paper #FBF7F1); plain cards stay
     white so they read as soft surfaces on the cream ground;
   - colour lives in focus elements (FocusCard, pills, terra accents);
   - radii, shadows (warm brown-tinted) and type come from globals.css;
   - display font = M PLUS Rounded 1c (var(--font-display)), body = Nunito. */

/** Plain white card: --radius-lg (24), warm --shadow-card. Reads as a
    soft card on the cream page. The workhorse surface for lists,
    settings rows, stat blocks. */
export function Card({
  children,
  style,
  className,
  onClick,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "16px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Pastel focus card: one per screen (hero / return card / highlight).
    --radius-xl (28), no shadow needed on a coloured surface. */
export function FocusCard({
  bg,
  children,
  style,
  className,
}: {
  /** Pastel background, e.g. "var(--mint)" or a sphere colour. */
  bg: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: bg,
        borderRadius: "var(--radius-xl)",
        padding: "22px 22px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Screen header: tiny uppercase label (date / context) over a big plump
    display-font H1. `children` is the H1 content so callers can embed
    interactive spans (e.g. the editable name on Today). */
export function ScreenHeader({
  label,
  children,
  style,
}: {
  /** Small uppercase line above the title (date, section context). */
  label?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ padding: "8px 20px 18px", ...style }}>
      {label != null && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink-40)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: "var(--ink-strong)",
          margin: 0,
        }}
      >
        {children}
      </h1>
    </div>
  );
}

/** Small uppercase section label in the display font (between groups). */
export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 800,
        color: "var(--ink-40)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Rounded pill button. `variant="outline"` (default) is white with a thin
    border; `variant="filled"` uses `color` (pastel) behind dark ink text. */
export function PillButton({
  children,
  onClick,
  disabled,
  variant = "outline",
  color,
  style,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "outline" | "filled";
  /** Fill colour for the "filled" variant, e.g. "var(--mint)". */
  color?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border:
          variant === "outline" ? "1.5px solid var(--ink-10)" : "none",
        background:
          variant === "filled" ? color ?? "var(--mint)" : "#FFFFFF",
        color: "var(--ink-strong)",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 200ms, background 200ms",
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

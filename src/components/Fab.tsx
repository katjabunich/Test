"use client";

export default function Fab({ onClick, label = "Новая задача" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="tap"
      style={{
        position: "fixed",
        bottom: "calc(110px + env(safe-area-inset-bottom))",
        right: "calc(50% - 230px + 18px)",
        width: 58,
        height: 58,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        background:
          "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.4), transparent 55%), linear-gradient(150deg, #14CAC4 0%, #07918D 100%)",
        color: "white",
        boxShadow: [
          "0 1px 1px rgba(255,255,255,0.4) inset",
          "0 -1px 2px rgba(7,145,141,0.25) inset",
          "0 6px 14px rgba(10,186,181,0.35)",
          "0 18px 34px rgba(10,186,181,0.22)",
        ].join(", "),
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

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
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        background:
          "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 55%), linear-gradient(140deg, #14CAC4 0%, #0ABAB5 55%, #07918D 100%)",
        color: "white",
        boxShadow: [
          "0 1px 1px rgba(255,255,255,0.4) inset",
          "0 -1px 2px rgba(7,145,141,0.25) inset",
          "0 6px 14px rgba(10,186,181,0.45)",
          "0 18px 40px rgba(10,186,181,0.30)",
          "0 1px 2px rgba(10,40,40,0.10)",
        ].join(", "),
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

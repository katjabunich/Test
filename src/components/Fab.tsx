"use client";

export default function Fab({ onClick, label = "Новая задача" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        position: "fixed",
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        right: "calc(50% - 215px + 16px)",
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: "var(--accent)",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        boxShadow:
          "0 8px 24px rgba(10, 186, 181, 0.35), 0 1px 2px rgba(10, 40, 40, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

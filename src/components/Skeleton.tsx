import type { CSSProperties } from "react";

/** Pulsing rectangle placeholder used inside loading.tsx files. */
export default function Skeleton({
  h = 16,
  w = "100%",
  br = 10,
  style,
}: {
  h?: number | string;
  w?: number | string;
  br?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="skel"
      style={{ height: h, width: w, borderRadius: br, ...style }}
    />
  );
}

export function SkeletonRing({ size = 56 }: { size?: number }) {
  return (
    <div
      className="skel"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
      }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        /* Matches the warm, whisper-shadow task cards of «Рассвет». */
        background: "var(--paper-warm)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 1px 3px rgba(105,74,50,0.05)",
      }}
    >
      <div
        className="skel"
        style={{ width: 22, height: 22, borderRadius: 11 }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton h={14} w="65%" />
        <Skeleton h={11} w="35%" />
      </div>
    </div>
  );
}

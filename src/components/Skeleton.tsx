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
        padding: "12px 14px",
        background: "var(--paper-warm)",
        border: "1px solid var(--ink-05)",
        borderRadius: 16,
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

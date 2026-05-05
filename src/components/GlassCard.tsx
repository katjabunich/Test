import type { CSSProperties, ReactNode } from "react";

export default function GlassCard({
  children,
  style,
  padding = 16,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number | string;
}) {
  return (
    <div
      className="glass"
      style={{
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

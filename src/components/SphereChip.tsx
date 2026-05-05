import type { Sphere } from "@/lib/data";

export function SphereDot({ sphere, size = 8 }: { sphere?: Sphere | null; size?: number }) {
  if (!sphere) return null;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: sphere.color,
        flexShrink: 0,
      }}
    />
  );
}

export function SphereChip({
  sphere,
  selected,
  onClick,
}: {
  sphere: Sphere | null;
  selected?: boolean;
  onClick?: () => void;
}) {
  const label = sphere?.name ?? "Все";
  const color = sphere?.color ?? "#9CA8B0";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        border: selected ? `1.5px solid ${color}` : "1px solid var(--hairline)",
        background: selected ? `${color}22` : "rgba(255,255,255,0.6)",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {sphere && (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
      {sphere?.emoji && <span>{sphere.emoji}</span>}
      <span>{label}</span>
    </button>
  );
}

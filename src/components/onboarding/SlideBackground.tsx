"use client";

/** Vivid mesh-gradient background per slide. Three large radial blobs in
   the v4 palette, drifting subtly so the scene feels alive. The blobs
   are absolute-positioned with `inset` so they cover the full slide. */
export default function SlideBackground({ variant }: { variant: 0 | 1 | 2 }) {
  // Each variant is a different chord of the v4 palette + a unique
  // composition of three blobs.
  const variants = [
    // 0 — warm welcome (butter + peach)
    {
      blobs: [
        { color: "rgba(245,197,99,0.55)",  top: "-20%", left: "55%", size: 520 },
        { color: "rgba(243,167,139,0.55)", top: "60%",  left: "-20%", size: 480 },
        { color: "rgba(134,199,154,0.32)", top: "30%",  left: "75%",  size: 360 },
      ],
    },
    // 1 — structure (mint + pool)
    {
      blobs: [
        { color: "rgba(134,199,154,0.55)", top: "-15%", left: "-20%", size: 520 },
        { color: "rgba(125,150,168,0.50)", top: "55%",  left: "60%",  size: 480 },
        { color: "rgba(245,197,99,0.30)",  top: "20%",  left: "85%",  size: 320 },
      ],
    },
    // 2 — celebration (mint + lilac + butter)
    {
      blobs: [
        { color: "rgba(134,199,154,0.55)", top: "-10%", left: "65%",  size: 500 },
        { color: "rgba(181,163,223,0.55)", top: "55%",  left: "-15%", size: 480 },
        { color: "rgba(245,197,99,0.40)",  top: "25%",  left: "30%",  size: 380 },
      ],
    },
  ];

  const v = variants[variant];

  return (
    <>
      {/* Base wash so transitions between slides are continuous */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--paper)",
          pointerEvents: "none",
        }}
      />
      {v.blobs.map((b, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${b.color}, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(2px)",
            animation: `bg-drift-${i} 38s ease-in-out infinite alternate`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      {/* Soft white-ish wash on top to keep contrast for text */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(251,246,238,0.0) 0%, rgba(251,246,238,0.35) 60%, rgba(251,246,238,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      <style>{`
        @keyframes bg-drift-0 {
          0%   { transform: translate(-50%, -50%); }
          100% { transform: translate(-44%, -55%); }
        }
        @keyframes bg-drift-1 {
          0%   { transform: translate(-50%, -50%); }
          100% { transform: translate(-56%, -45%); }
        }
        @keyframes bg-drift-2 {
          0%   { transform: translate(-50%, -50%); }
          100% { transform: translate(-46%, -53%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden] { animation: none !important; }
        }
      `}</style>
    </>
  );
}

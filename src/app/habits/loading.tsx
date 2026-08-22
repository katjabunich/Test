import Skeleton, { SkeletonRing } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      {/* ScreenHeader: small label + plump 42px H1 */}
      <div style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton h={13} w={110} />
        <Skeleton h={44} w="62%" br={12} />
      </div>
      {/* Terra hero FocusCard — skeleton stays a warm neutral shimmer
          (.skel) rather than pre-painting the loud terra block. */}
      <div style={{ padding: "0 20px 18px" }}>
        <div className="skel" style={{ height: 180, borderRadius: "var(--radius-xl)" }} />
      </div>
      {/* 2-column tile grid matching the tiled /habits composition:
          ring on top, name, heatmap, streak line. */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={13} w={110} style={{ marginLeft: 4, marginBottom: 2 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
                padding: "16px 12px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <SkeletonRing size={60} />
              <Skeleton h={15} w="70%" />
              <Skeleton h={19} w={74} br={4} />
              <Skeleton h={22} w={64} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import Skeleton, { SkeletonRing, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "8px 0 0" }}>
      {/* Header: tiny date label + big plump greeting */}
      <div
        style={{
          padding: "8px 20px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton h={13} w={110} />
        <Skeleton h={42} w="78%" br={12} />
      </div>

      {/* Habit rings — left-aligned, fixed gap (matches TodayView) */}
      <div
        style={{
          padding: "0 20px 22px",
          display: "flex",
          gap: 14,
          justifyContent: "flex-start",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <SkeletonRing size={56} />
            <Skeleton h={10} w={40} />
          </div>
        ))}
      </div>

      {/* Progress bar line */}
      <div
        style={{
          padding: "0 20px 6px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Skeleton h={6} br={999} style={{ flex: 1 }} w="auto" />
        <Skeleton h={12} w={48} />
      </div>

      {/* Task cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

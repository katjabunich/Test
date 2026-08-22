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

      {/* Sunrise scene placeholder — sun disc near the left horizon,
          caption top-right, horizon hairline (matches TodayView) */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ position: "relative", height: 124 }}>
          <div
            className="skel"
            style={{
              position: "absolute",
              left: 10,
              bottom: 20,
              width: 38,
              height: 38,
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <Skeleton h={14} w={56} />
            <Skeleton h={11} w={88} />
          </div>
          <div
            className="skel"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 18,
              height: 1,
              borderRadius: 999,
            }}
          />
        </div>
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

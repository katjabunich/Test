import Skeleton, { SkeletonRing, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "8px 0 0" }}>
      <div
        style={{
          padding: "8px 22px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton h={11} w={120} />
        <Skeleton h={36} w="70%" br={10} />
      </div>

      <div
        style={{
          padding: "0 22px 22px",
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              width: 76,
            }}
          >
            <SkeletonRing size={56} />
            <Skeleton h={10} w={40} />
          </div>
        ))}
      </div>

      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          className="skel"
          style={{ height: 168, borderRadius: 22 }}
        />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

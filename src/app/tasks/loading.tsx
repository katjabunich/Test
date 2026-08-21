import Skeleton, { SkeletonRow } from "@/components/Skeleton";

/* Mirrors the /tasks composition: ScreenHeader (label + plump 42px H1),
   pill filter chips, week strip, then card groups under plump section
   labels. Unified 20px horizontal padding. */
export default function Loading() {
  return (
    <div>
      <div style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={13} w={130} br={7} />
        <Skeleton h={44} w="52%" br={12} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} h={36} w={84} br={999} />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          padding: "0 20px 16px",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} h={62} w="100%" br="var(--radius-sm)" />
        ))}
      </div>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 22 }}>
        {[0, 1, 2].map((g) => (
          <div key={g}>
            <div style={{ padding: "0 6px 10px" }}>
              <Skeleton h={12} w={96} br={6} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

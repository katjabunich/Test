import Skeleton, { SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={11} w={140} />
        <Skeleton h={42} w="48%" br={10} />
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 22px 16px", overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} h={32} w={80} br={10} />
        ))}
      </div>
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1, 2].map((g) => (
          <div key={g}>
            <div style={{ display: "flex", gap: 8, padding: "0 4px 10px" }}>
              <Skeleton h={11} w={90} />
              <div style={{ flex: 1, height: 1, background: "var(--ink-10)", marginTop: 5 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={11} w={120} />
        <Skeleton h={42} w="58%" br={10} />
      </div>
      <div style={{ padding: "0 18px 14px" }}>
        <div className="skel" style={{ height: 130, borderRadius: 22 }} />
      </div>
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton h={11} w={120} style={{ marginLeft: 4, marginBottom: 4 }} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--paper-warm)",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid var(--ink-05)",
            }}
          >
            <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton h={14} w="55%" />
              <Skeleton h={11} w="35%" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <Skeleton h={26} w={32} />
              <Skeleton h={9} w={28} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

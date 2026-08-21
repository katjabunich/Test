import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      {/* ScreenHeader: small label + plump 42px H1 */}
      <div style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton h={13} w={110} />
        <Skeleton h={44} w="62%" br={12} />
      </div>
      {/* Mint hero FocusCard */}
      <div style={{ padding: "0 20px 18px" }}>
        <div className="skel" style={{ height: 180, borderRadius: "var(--radius-xl)" }} />
      </div>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={13} w={110} style={{ marginLeft: 4, marginBottom: 2 }} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton h={15} w="55%" />
              <Skeleton h={9} w="45%" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <Skeleton h={28} w={34} />
              <Skeleton h={9} w={28} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      {/* ScreenHeader: small uppercase label over the big plump H1,
          with the round close button placeholder on the right. */}
      <div
        style={{
          padding: "8px 20px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton h={13} w={140} />
          <Skeleton h={42} w="70%" br={12} />
        </div>
        <Skeleton h={44} w={44} br={999} style={{ flexShrink: 0, marginTop: 8 }} />
      </div>
      <div style={{ padding: "0 20px" }}>
        <Skeleton h={13} w={110} style={{ marginBottom: 12, marginLeft: 4 }} />
        <div
          className="skel"
          style={{ height: 280, borderRadius: "var(--radius-lg)", marginBottom: 12 }}
        />
        <Skeleton h={48} br={999} style={{ marginBottom: 24 }} />
        <Skeleton h={13} w={110} style={{ marginBottom: 12, marginLeft: 4 }} />
        <div
          className="skel"
          style={{ height: 180, borderRadius: "var(--radius-lg)" }}
        />
      </div>
    </div>
  );
}

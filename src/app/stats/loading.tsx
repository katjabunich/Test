import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      {/* ScreenHeader: plump display H1 */}
      <div style={{ padding: "8px 20px 14px" }}>
        <Skeleton h={44} w="60%" br={12} />
      </div>
      {/* Hero number + subtitle + comparison line */}
      <div
        style={{
          padding: "0 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton h={92} w={140} br={18} />
        <Skeleton h={12} w={170} />
        <Skeleton h={11} w={130} />
      </div>
      {/* Underline tabs */}
      <div style={{ display: "flex", gap: 24, padding: "0 20px 22px" }}>
        <Skeleton h={26} w={82} br={8} />
        <Skeleton h={26} w={72} br={8} />
        <Skeleton h={26} w={64} br={8} />
      </div>
      {/* Sphere breakdown rows */}
      <div
        style={{
          padding: "0 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h={28} w="100%" br={10} />
        ))}
      </div>
      {/* Day cards */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {[0, 1].map((i) => (
          <Skeleton key={i} h={120} w="100%" br="var(--radius-lg)" />
        ))}
      </div>
    </div>
  );
}

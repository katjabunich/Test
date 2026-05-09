import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={42} w="55%" br={10} />
        <Skeleton h={11} w={170} />
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 22px 18px" }}>
        <Skeleton h={32} w={92} br={10} />
        <Skeleton h={32} w={82} br={10} />
        <Skeleton h={32} w={82} br={10} />
      </div>
      <div style={{ padding: "0 18px 18px" }}>
        <Skeleton h={140} w="100%" br={22} />
      </div>
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton h={11} w={120} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h={28} w="100%" br={14} />
        ))}
      </div>
    </div>
  );
}

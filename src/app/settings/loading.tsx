import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={11} w={140} />
        <Skeleton h={42} w="70%" br={10} />
      </div>
      <div style={{ padding: "0 18px" }}>
        <Skeleton h={11} w={110} style={{ marginBottom: 10, marginLeft: 4 }} />
        <div
          className="skel"
          style={{ height: 280, borderRadius: 18, marginBottom: 10 }}
        />
        <Skeleton h={11} w={110} style={{ marginBottom: 10, marginTop: 24, marginLeft: 4 }} />
        <div className="skel" style={{ height: 180, borderRadius: 18 }} />
      </div>
    </div>
  );
}

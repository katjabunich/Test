"use client";

import { usePathname } from "next/navigation";

/** Re-fires .page-in animation on every route change by keying children
    on the current pathname. */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-in" style={{ minHeight: "100dvh" }}>
      {children}
    </div>
  );
}

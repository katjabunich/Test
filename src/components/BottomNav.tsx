"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavTab = "today" | "tasks" | "habits" | "settings";

const TABS: { id: NavTab; label: string; href: string }[] = [
  { id: "today",    label: "Сегодня",  href: "/" },
  { id: "tasks",    label: "Все",      href: "/tasks" },
  { id: "habits",   label: "Привычки", href: "/habits" },
  { id: "settings", label: "Настройки", href: "/settings" },
];

function activeTabFor(pathname: string): NavTab {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/settings")) return "settings";
  return "today";
}

function NavIcon({ name, color }: { name: NavTab; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "today":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill={color} />
          <circle cx="12" cy="12" r="8" {...stroke} />
        </svg>
      );
    case "tasks":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 7h14M5 12h14M5 17h9" {...stroke} />
        </svg>
      );
    case "habits":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7 13l3 3 7-7" {...stroke} />
          <circle cx="12" cy="12" r="9" {...stroke} />
        </svg>
      );
    case "settings":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7L5.6 5.6" {...stroke} />
        </svg>
      );
  }
}

export default function BottomNav() {
  const pathname = usePathname();
  const active = activeTabFor(pathname);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 430,
        margin: "0 auto",
        padding: "0 12px",
        paddingBottom: "max(12px, calc(env(safe-area-inset-bottom) + 8px))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: 28,
          padding: "8px 4px",
          display: "flex",
          justifyContent: "space-around",
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          pointerEvents: "auto",
          background: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "0.5px solid rgba(255, 255, 255, 0.8)",
          boxShadow: [
            "inset 1.5px 1.5px 1px rgba(255, 255, 255, 0.85)",
            "inset -1px -1px 1px rgba(255, 255, 255, 0.4)",
            "0 1px 3px rgba(10, 40, 40, 0.05)",
            "0 8px 24px rgba(10, 40, 40, 0.08)",
          ].join(", "),
        }}
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const color = isActive ? "var(--accent)" : "var(--text-muted)";
          return (
            <Link
              key={tab.id}
              href={tab.href}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "4px 8px",
                cursor: "pointer",
                flex: 1,
                minHeight: 44,
                color,
                textDecoration: "none",
              }}
            >
              <NavIcon name={tab.id} color={color} />
              <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: 0.05 }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavTab = "today" | "tasks" | "habits" | "settings";

const TABS: { id: NavTab; label: string; href: string }[] = [
  { id: "today",    label: "Сегодня",  href: "/" },
  { id: "tasks",    label: "Все",      href: "/tasks" },
  { id: "habits",   label: "Привычки", href: "/habits" },
  { id: "settings", label: "Опции",    href: "/settings" },
];

function activeTabFor(pathname: string): NavTab {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/settings")) return "settings";
  return "today";
}

function Icon({ name, active }: { name: NavTab; active: boolean }) {
  const stroke = active ? "var(--accent)" : "var(--text-muted)";
  const fill   = active ? "var(--accent-tint)" : "transparent";
  switch (name) {
    case "today":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill={fill} stroke={stroke} strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3" fill={stroke} />
        </svg>
      );
    case "tasks":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="3" fill={fill} stroke={stroke} strokeWidth="1.7" />
          <path d="M8 10h8M8 14h5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "habits":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill={fill} stroke={stroke} strokeWidth="1.7" />
          <path d="M8 12.5l2.6 2.5L16 9.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 7h14M5 12h10M5 17h6" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function BottomNav() {
  const pathname = usePathname();
  const active = activeTabFor(pathname);
  const activeIndex = TABS.findIndex((t) => t.id === active);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 460,
        margin: "0 auto",
        padding: "0 14px",
        paddingBottom: "max(14px, calc(env(safe-area-inset-bottom) + 8px))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: 30,
          padding: "8px 6px",
          position: "relative",
          isolation: "isolate",
          pointerEvents: "auto",
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "0.5px solid rgba(255, 255, 255, 0.85)",
          boxShadow: [
            "inset 1.5px 1.5px 1px rgba(255, 255, 255, 0.85)",
            "inset -1px -1px 1px rgba(255, 255, 255, 0.4)",
            "0 1px 3px rgba(10, 40, 40, 0.05)",
            "0 12px 32px rgba(10, 40, 40, 0.08)",
          ].join(", "),
        }}
      >
        {/* Sliding pill behind active tab */}
        <div
          style={{
            position: "absolute",
            top: 8,
            bottom: 8,
            left: `calc(6px + ${activeIndex} * (100% - 12px) / ${TABS.length})`,
            width: `calc((100% - 12px) / ${TABS.length})`,
            background: "linear-gradient(180deg, rgba(10,186,181,0.10), rgba(10,186,181,0.16))",
            border: "1px solid rgba(10,186,181,0.18)",
            borderRadius: 24,
            transition: "left 380ms var(--ease-spring)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-around", position: "relative" }}>
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="tap"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "8px 6px",
                  flex: 1,
                  minHeight: 48,
                  color: isActive ? "var(--accent-deep)" : "var(--text-muted)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <Icon name={tab.id} active={isActive} />
                <span style={{ fontSize: 10.5, letterSpacing: 0.2 }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

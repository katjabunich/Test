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
  const stroke = active ? "var(--accent-deep)" : "var(--text-muted)";
  switch (name) {
    case "today":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3" fill={stroke} />
        </svg>
      );
    case "tasks":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="3" stroke={stroke} strokeWidth="1.6" />
          <path d="M8 10h8M8 14h5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "habits":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
          <path d="M8 12.5l2.6 2.5L16 9.5" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 7h14M5 12h10M5 17h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
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
          borderRadius: 28,
          padding: 6,
          position: "relative",
          isolation: "isolate",
          pointerEvents: "auto",
          background: "var(--surface)",
          border: "1px solid var(--hairline-soft)",
          boxShadow: "var(--shadow-card-lg)",
        }}
      >
        {/* Sliding pill */}
        <div
          style={{
            position: "absolute",
            top: 6,
            bottom: 6,
            left: `calc(6px + ${activeIndex} * (100% - 12px) / ${TABS.length})`,
            width: `calc((100% - 12px) / ${TABS.length})`,
            background: "var(--accent-cream)",
            border: "1px solid var(--accent-soft)",
            borderRadius: 22,
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
                <span style={{ fontSize: 10.5, letterSpacing: 0.15 }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

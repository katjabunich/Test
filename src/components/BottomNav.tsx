"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";

export type NavTab = "today" | "tasks" | "habits" | "settings";

const TABS: { id: NavTab; href: string; Icon: keyof typeof Icons }[] = [
  { id: "today",    href: "/",          Icon: "Sun" },
  { id: "tasks",    href: "/tasks",     Icon: "List" },
  { id: "habits",   href: "/habits",    Icon: "Loop" },
  { id: "settings", href: "/settings",  Icon: "Settings" },
];

function activeTabFor(pathname: string): NavTab {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/settings")) return "settings";
  return "today";
}

/** Bottom nav per v4 mockup: 5 slots, no labels, central FAB.
    The plus button routes back to the active screen with ?new=1 — pages
    listen for that and open their primary creation modal. */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeTabFor(pathname);

  // Tabs split around the central FAB (index 2).
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  function handleNew() {
    const sep = pathname.includes("?") ? "&" : "?";
    router.push(`${pathname}${sep}new=1`);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 460,
        margin: "0 auto",
        background: "var(--paper)",
        borderTop: "1px solid var(--ink-10)",
        padding: "14px 24px max(14px, calc(env(safe-area-inset-bottom) + 8px))",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      {[...left, null, ...right].map((tab, i) => {
        if (!tab) {
          return (
            <button
              key="fab"
              type="button"
              onClick={handleNew}
              aria-label="Создать"
              className="tap"
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                border: "none",
                background: "var(--mint-deep)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(79,156,106,0.35)",
              }}
            >
              <Icons.Plus size={22} stroke="#fff" strokeWidth={2.4} />
            </button>
          );
        }
        const isActive = active === tab.id;
        const IconComp = Icons[tab.Icon];
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.id}
            className="tap"
            style={{
              width: 36,
              height: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: isActive ? "var(--ink)" : "var(--ink-40)",
            }}
          >
            <IconComp
              size={24}
              stroke="currentColor"
              strokeWidth={isActive ? 2.2 : 1.7}
            />
            <span
              aria-hidden
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                background: isActive ? "var(--ink)" : "transparent",
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}

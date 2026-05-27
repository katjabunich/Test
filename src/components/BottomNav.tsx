"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";
import { useT } from "@/lib/i18n/client";

export type NavTab = "today" | "tasks" | "habits" | "stats";

/* Settings lives in the top-right gear (SettingsTrigger), not here —
   bottom nav stays focused on the four daily-use surfaces. */
const TABS: { id: NavTab; href: string; Icon: keyof typeof Icons; labelKey: string }[] = [
  { id: "today",    href: "/",          Icon: "Sun",      labelKey: "nav.today" },
  { id: "tasks",    href: "/tasks",     Icon: "List",     labelKey: "nav.tasks" },
  { id: "habits",   href: "/habits",    Icon: "Loop",     labelKey: "nav.habits" },
  { id: "stats",    href: "/stats",     Icon: "BarChart", labelKey: "nav.stats" },
];

function activeTabFor(pathname: string): NavTab {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/stats")) return "stats";
  return "today";
}

/** Bottom nav per v4 mockup: 5 slots, no labels, central FAB.
    The plus button routes back to the active screen with ?new=1 — pages
    listen for that and open their primary creation modal. */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
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
        bottom: "max(8px, calc(env(safe-area-inset-bottom, 0px) + 4px))",
        left: 12,
        right: 12,
        maxWidth: 460,
        margin: "0 auto",
        background: "var(--paper)",
        borderRadius: 28,
        boxShadow: "var(--shadow-nav)",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
        transform: "translate3d(0, 0, 0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
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
                width: 54,
                height: 54,
                borderRadius: 27,
                border: "none",
                background: "var(--mint-deep)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(79,156,106,0.30)",
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
              minWidth: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: isActive ? "var(--ink)" : "var(--ink-40)",
              textDecoration: "none",
            }}
          >
            <IconComp
              size={22}
              stroke="currentColor"
              strokeWidth={isActive ? 2.2 : 1.7}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.01em",
                lineHeight: 1,
                color: "currentColor",
              }}
            >
              {t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

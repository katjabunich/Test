"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icons } from "@/components/Icons";

/** Fixed-position gear in the top-right corner of every authenticated
    screen. Replaces the bottom-nav Settings tab — the bottom row was
    crowded at five tabs + FAB, and Settings is rarely-accessed enough
    that hiding it behind a gear icon (the standard mobile pattern) buys
    breathing room without hurting discoverability.

    Carries the current pathname through as `?from=` so the close button
    on /settings can drop the user back where they were instead of
    always sending them home. */
export default function SettingsTrigger() {
  const pathname = usePathname();
  const search = useSearchParams();
  /* On the Settings page itself the trigger is its own anti-pattern, and
     the Login flow doesn't yet have a session to write against. */
  if (pathname.startsWith("/settings") || pathname.startsWith("/login")) {
    return null;
  }

  const queryString = search.toString();
  const from = encodeURIComponent(
    queryString ? `${pathname}?${queryString}` : pathname,
  );

  return (
    <Link
      href={`/settings?from=${from}`}
      aria-label="Настройки"
      className="tap"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        background: "var(--paper)",
        boxShadow: "0 2px 10px rgba(45,38,32,0.12)",
        border: "1px solid var(--ink-05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        color: "var(--ink-60)",
        textDecoration: "none",
      }}
    >
      <Icons.Settings size={18} stroke="currentColor" strokeWidth={1.8} />
    </Link>
  );
}

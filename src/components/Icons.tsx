/* Lucide-style thin-line icon set used across the v4 design.
   Matched to /tmp/design-v4/.../hifi/icons.jsx so screens render the
   same shapes the designer specified. */

import type { CSSProperties } from "react";

type Props = {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  style?: CSSProperties;
};

function I({
  size = 20,
  stroke = "currentColor",
  strokeWidth = 1.8,
  fill = "none",
  d,
  style,
  children,
}: Props & { d?: string; children?: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const Icons = {
  Sun: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </I>
  ),
  List: (p: Props) => (
    <I {...p}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </I>
  ),
  Loop: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </I>
  ),
  Settings: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </I>
  ),
  Plus: (p: Props) => <I {...p} d="M12 5v14M5 12h14" />,
  Check: (p: Props) => <I {...p} strokeWidth={2.4} d="M5 12l5 5L20 7" />,
  Chevron: (p: Props) => <I {...p} d="M9 6l6 6-6 6" />,
  ChevronDown: (p: Props) => <I {...p} d="M6 9l6 6 6-6" />,
  /* Coffee cup with steam — sphere "Работа" */
  Briefcase: (p: Props) => (
    <I {...p}>
      <path d="M4 10h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M17 12h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 4c0 1.2 1 1.4 1 2.6S8 8 8 9" />
      <path d="M12 4c0 1.2 1 1.4 1 2.6S12 8 12 9" />
    </I>
  ),
  /* House with chimney — sphere "Дом" */
  Home: (p: Props) => (
    <I {...p}>
      <path d="M3 12.5l9-8 9 8V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M10 22v-6.5h4V22" />
      <path d="M16 5.4V9" />
    </I>
  ),
  /* Microphone with sound waves — sphere "Канал" */
  Video: (p: Props) => (
    <I {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </I>
  ),
  /* Tulip — sphere "Голландский" */
  Globe: (p: Props) => (
    <I {...p}>
      <path d="M12 3c-3 1.6-4.5 4.4-4.5 7 1 1 2.5 1.2 4.5 1.2s3.5-.2 4.5-1.2c0-2.6-1.5-5.4-4.5-7z" />
      <path d="M12 3v8.2" />
      <path d="M12 21v-8" />
      <path d="M12 18c-3 0-5.2-2-5.2-5 3 0 5.2 2 5.2 5z" />
    </I>
  ),
  /* Sparkle — sphere "AI" */
  Cpu: (p: Props) => (
    <I {...p}>
      <path d="M12 3l1.7 5.6 5.6 1.7-5.6 1.7L12 17.6l-1.7-5.6L4.7 10.3l5.6-1.7z" />
      <path d="M19 4.5v2.5M19 16v2.5M5 16.5v2" />
    </I>
  ),
  Drop: (p: Props) => <I {...p} d="M12 3l5.5 7a7 7 0 1 1-11 0z" />,
  Run: (p: Props) => (
    <I {...p}>
      <circle cx="14" cy="4.5" r="1.8" />
      <path d="M5 22l4.5-6 1-5L7 8.5 5 12M9 17l3 2 1-3-2-3M14 14l4 2 2-4" />
    </I>
  ),
  Book: (p: Props) => (
    <I {...p}>
      <path d="M4 4.5v15.5a1.5 1.5 0 0 1 1.5-1.5H20V3H5.5A1.5 1.5 0 0 0 4 4.5z" />
      <path d="M4 19a1.5 1.5 0 0 0 1.5 1.5H20" />
    </I>
  ),
  Lotus: (p: Props) => (
    <I {...p} d="M12 4c-2 3-2 6 0 9 2-3 2-6 0-9zM4 14c2-2 5-3 8-2-1 3-3 5-6 5-1 0-2-1-2-3zM20 14c-2-2-5-3-8-2 1 3 3 5 6 5 1 0 2-1 2-3z" />
  ),
  Bell: (p: Props) => (
    <I {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 0 0 4 0" />
  ),
  Cloud: (p: Props) => (
    <I {...p} d="M17 19a4 4 0 0 0 .9-7.9 5 5 0 0 0-9.7-1A4 4 0 0 0 7 19h10z" />
  ),
  Phone: (p: Props) => (
    <I {...p}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </I>
  ),
  Calendar: (p: Props) => (
    <I {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </I>
  ),
  Note: (p: Props) => (
    <I {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M9 14h6M9 18h4" />
    </I>
  ),
  Trash: (p: Props) => (
    <I {...p} d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
  ),
  Repeat: (p: Props) => (
    <I {...p} d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  ),
  Alert: (p: Props) => (
    <I {...p}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </I>
  ),
  Smile: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </I>
  ),
  Dot: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </I>
  ),
  Volume: (p: Props) => (
    <I {...p}>
      <path d="M4 10v4h3l5 4V6L7 10z" />
      <path d="M15 9c1.2 1.4 1.2 4.6 0 6" />
      <path d="M17.5 6.5c2.4 2.6 2.4 8.4 0 11" />
    </I>
  ),
  Vibrate: (p: Props) => (
    <I {...p}>
      <rect x="9" y="4" width="6" height="16" rx="1.5" />
      <path d="M5 9l-1 1 1 1M5 13l-1 1 1 1" />
      <path d="M19 9l1 1-1 1M19 13l1 1-1 1" />
    </I>
  ),
  User: (p: Props) => (
    <I {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </I>
  ),
  LogOut: (p: Props) => (
    <I {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </I>
  ),
  Lock: (p: Props) => (
    <I {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </I>
  ),
};

export type IconKey = keyof typeof Icons;

/** Curated set of habit icons — surfaced in the habit edit modal as
   quick-pick chips. The user can also type a custom emoji. */
export const HABIT_PRESET_ICONS: IconKey[] = [
  "Drop", "Run", "Book", "Lotus", "Globe", "Smile", "Cpu", "Note",
];

/** Storage convention: habit.emoji holds either ":<IconKey>" (built-in
   line-art icon) or a custom emoji character. parseHabitIcon decodes it. */
export function parseHabitIcon(value: string | null | undefined):
  | { kind: "icon"; iconKey: IconKey }
  | { kind: "emoji"; emoji: string }
  | { kind: "none" } {
  if (!value) return { kind: "none" };
  if (value.startsWith(":")) {
    const key = value.slice(1);
    if (key in Icons) return { kind: "icon", iconKey: key as IconKey };
  }
  return { kind: "emoji", emoji: value };
}

/** Render whatever a habit's stored icon-or-emoji evaluates to. Used inside
   habit rings + habit cards. Falls back to a small dot if nothing is set. */
export function HabitIcon({
  value,
  size,
  stroke,
  strokeWidth,
}: {
  value: string | null | undefined;
  size: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const parsed = parseHabitIcon(value);
  if (parsed.kind === "icon") {
    const Comp = Icons[parsed.iconKey];
    return <Comp size={size} stroke={stroke} strokeWidth={strokeWidth ?? 2} />;
  }
  if (parsed.kind === "emoji") {
    return (
      <span
        style={{
          fontSize: Math.round(size * 0.95),
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {parsed.emoji}
      </span>
    );
  }
  return <Icons.Dot size={size} stroke={stroke ?? "currentColor"} />;
}

/** Map sphere name to a default icon — used by hero card, sphere list, etc.
   Both Russian and English default names are mapped so the icon shows
   correctly regardless of the language the user signed up in. Custom
   (user-created) spheres fall back to a dot. */
const NAME_TO_ICON: Record<string, IconKey> = {
  // Current defaults
  "Работа": "Briefcase",
  "Дом": "Home",
  "Личное": "Lotus",
  "Work": "Briefcase",
  "Home": "Home",
  "Personal": "Lotus",
  // Legacy seeds (kept so users created before the cleanup keep their icons)
  "Канал": "Video",
  "Голландский": "Globe",
  "AI": "Cpu",
};

export function iconForSphereName(name: string): IconKey {
  return NAME_TO_ICON[name] ?? "Dot";
}

export function SphereIcon({
  name,
  size = 18,
  stroke,
  strokeWidth,
}: {
  name: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const Comp = Icons[iconForSphereName(name)];
  return <Comp size={size} stroke={stroke} strokeWidth={strokeWidth} />;
}

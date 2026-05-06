"use client";

import { Icons, type IconKey } from "@/components/Icons";

const SPHERES: { name: string; color: string; icon: IconKey }[] = [
  { name: "Работа",      color: "#f3a78b", icon: "Briefcase" },
  { name: "Канал",       color: "#f5c563", icon: "Video" },
  { name: "Дом",         color: "#86c79a", icon: "Home" },
  { name: "Голландский", color: "#7d96a8", icon: "Globe" },
  { name: "AI",          color: "#b5a3df", icon: "Cpu" },
];

/** Row of real sphere chips with their v4 colours and lucide-style
   icons, laid out the same way the /tasks filter row does. Each chip
   stagger-fades in. */
export default function SpheresPreview() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
        maxWidth: 320,
        margin: "0 auto",
      }}
    >
      {SPHERES.map((s, i) => {
        const Icon = Icons[s.icon];
        return (
          <div
            key={s.name}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              background: `${s.color}30`,
              border: `1.5px solid ${s.color}`,
              animation: `slide-in 380ms ${250 + i * 70}ms var(--ease-out) both`,
            }}
          >
            <Icon size={13} stroke="var(--ink)" strokeWidth={2.2} />
            <span
              className="mono lower"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {s.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Icons, type IconKey } from "@/components/Icons";

const MINT = "#86c79a";
const PEACH = "#f4936e";
const POOL = "#6ba4c2";
const LILAC = "#b5a3df";
const BUTTER = "#f5c563";

const SPHERES: { name: string; color: string; icon: IconKey }[] = [
  { name: "Работа",   color: PEACH,  icon: "Briefcase" },
  { name: "Учёба",    color: POOL,   icon: "Book" },
  { name: "Здоровье", color: MINT,   icon: "Run" },
  { name: "Хобби",    color: BUTTER, icon: "Smile" },
  { name: "Дом",      color: LILAC,  icon: "Home" },
];

const TASKS = [
  { title: "Подготовить отчёт",   sphere: "Работа",   color: PEACH,  time: "сегодня" },
  { title: "Урок английского",    sphere: "Учёба",    color: POOL,   time: "10:00" },
  { title: "Утренняя пробежка",   sphere: "Здоровье", color: MINT,   time: "14:00" },
  { title: "Дочитать главу",      sphere: "Хобби",    color: BUTTER, time: "сегодня" },
];

const enter = (delay: number) =>
  ({
    opacity: 0,
    animation: `slide-in 420ms ${delay}ms var(--ease-out) forwards`,
  }) as const;

export default function MockTasksContent() {
  return (
    <div style={{ padding: "8px 14px 0" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
          marginBottom: 3,
          ...enter(120),
        }}
      >
        12 активных
      </div>
      <div
        style={{
          fontFamily: "var(--font-emphasis)",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.04,
          color: "var(--ink)",
          ...enter(200),
        }}
      >
        Задачи<span style={{ color: "var(--mint-deep)" }}>.</span>
      </div>

      {/* Filter chips */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 4,
          overflow: "hidden",
        }}
      >
        <ChipSlot delay={380}>
          <FilterChip label="Все" count={12} active />
        </ChipSlot>
        {SPHERES.slice(0, 3).map((s, i) => (
          <ChipSlot key={s.name} delay={460 + i * 80}>
            <FilterChip label={s.name} count={3} color={s.color} />
          </ChipSlot>
        ))}
      </div>

      {/* Group label */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginTop: 14,
          marginBottom: 6,
          ...enter(740),
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-60)",
            letterSpacing: "-0.005em",
          }}
        >
          Сегодня
        </span>
        <span
          className="tnum"
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--ink-40)",
          }}
        >
          4
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "var(--ink-10)",
          }}
        />
      </div>

      {/* Task rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {TASKS.map((t, i) => (
          <div key={t.title} style={enter(820 + i * 70)}>
            <TaskRow {...t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChipSlot({ delay, children }: { delay: number; children: React.ReactNode }) {
  return <div style={enter(delay)}>{children}</div>;
}

function FilterChip({
  label,
  count,
  color,
  active,
}: {
  label: string;
  count: number;
  color?: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: 7,
        flexShrink: 0,
        background: active ? "var(--ink)" : "var(--paper-warm)",
        color: active ? "var(--paper)" : "var(--ink-80)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${active ? "var(--ink)" : "var(--ink-05)"}`,
      }}
    >
      {color && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            background: color,
          }}
        />
      )}
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: active ? "var(--paper)" : "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        className="tnum"
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: active ? "var(--paper)" : "var(--ink-40)",
          opacity: active ? 0.65 : 1,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function TaskRow({
  title,
  sphere,
  color,
  time,
}: {
  title: string;
  sphere: string;
  color: string;
  time: string;
}) {
  return (
    <div
      style={{
        background: "var(--paper-warm)",
        borderRadius: 9,
        padding: "6px 8px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        border: "1px solid var(--ink-05)",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          border: `1.5px solid ${color}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            marginTop: 2,
            fontSize: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontWeight: 600,
              color,
              letterSpacing: "-0.005em",
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                background: color,
              }}
            />
            {sphere}
          </span>
          <span style={{ color: "var(--ink-20)" }}>·</span>
          <span
            style={{
              fontWeight: 500,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

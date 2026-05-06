"use client";

import { Icons, type IconKey } from "@/components/Icons";

const MINT = "#86c79a";
const PEACH = "#f3a78b";
const POOL = "#7d96a8";
const LILAC = "#b5a3df";
const BUTTER = "#f5c563";

const SPHERES: { name: string; color: string; icon: IconKey }[] = [
  { name: "Работа",      color: PEACH,  icon: "Briefcase" },
  { name: "Канал",       color: BUTTER, icon: "Video" },
  { name: "Дом",         color: MINT,   icon: "Home" },
  { name: "Голландский", color: POOL,   icon: "Globe" },
  { name: "AI",          color: LILAC,  icon: "Cpu" },
];

const TASKS = [
  { title: "Подготовить деку для ревью", sphere: "Работа",      color: PEACH,  time: "сегодня" },
  { title: "Записать черновик ролика",   sphere: "Канал",       color: BUTTER, time: "10:00" },
  { title: "Помыть пол",                 sphere: "Дом",         color: MINT,   time: "сегодня" },
  { title: "Урок 14: voltooid",          sphere: "Голландский", color: POOL,   time: "14:00" },
];

export default function MockTasksContent() {
  return (
    <div style={{ padding: "8px 14px 0" }}>
      <div
        className="mono"
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--ink-60)",
          letterSpacing: "0.13em",
          marginBottom: 3,
        }}
      >
        14 АКТИВНЫХ
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          color: "var(--ink)",
        }}
      >
        Задачи<span style={{ color: "var(--mint-deep)" }}>.</span>
      </div>

      {/* Filter chips — horizontal, with sphere chips highlighted */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 4,
          overflow: "hidden",
        }}
      >
        <FilterChip label="Все" count={14} active />
        {SPHERES.slice(0, 3).map((s) => (
          <FilterChip
            key={s.name}
            label={s.name}
            count={3}
            color={s.color}
          />
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
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "var(--ink-60)",
            letterSpacing: "0.1em",
          }}
        >
          СЕГОДНЯ
        </span>
        <span
          className="mono tnum"
          style={{
            fontSize: 9,
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
        {TASKS.map((t) => (
          <TaskRow
            key={t.title}
            title={t.title}
            sphere={t.sphere}
            color={t.color}
            time={t.time}
          />
        ))}
      </div>
    </div>
  );
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
        className="mono lower"
        style={{
          fontSize: 8.5,
          fontWeight: 600,
          color: active ? "var(--paper)" : "var(--ink)",
        }}
      >
        {label}
      </span>
      <span
        className="mono tnum"
        style={{
          fontSize: 8.5,
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
          className="mono lower"
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            marginTop: 2,
            fontSize: 7.5,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontWeight: 600,
              color,
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
          <span style={{ fontWeight: 500, color: "var(--ink-60)" }}>{time}</span>
        </div>
      </div>
    </div>
  );
}

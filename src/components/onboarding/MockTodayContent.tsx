"use client";

import { Icons } from "@/components/Icons";

const MINT = "#86c79a";
const PEACH = "#f3a78b";
const POOL = "#7d96a8";
const LILAC = "#b5a3df";
const BUTTER = "#f5c563";

/** Compact today-screen mock to live inside a PhoneFrame: date eyebrow,
   greeting, four mini habit rings, hero card, two small task rows. */
export default function MockTodayContent() {
  return (
    <div style={{ padding: "8px 14px 0" }}>
      <div
        className="mono"
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--ink-60)",
          letterSpacing: "0.13em",
          marginBottom: 4,
        }}
      >
        06.05 — ВТ
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.034em",
          lineHeight: 1.04,
          color: "var(--ink)",
        }}
      >
        Доброе утро<span style={{ color: "var(--mint-deep)" }}>.</span>
      </div>

      {/* Habit rings row */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <MiniRing color={MINT} done IconComp={Icons.Drop} />
        <MiniRing color={POOL} done IconComp={Icons.Globe} />
        <MiniRing color={PEACH} progress={0.4} IconComp={Icons.Run} />
        <MiniRing color={LILAC} progress={0.85} IconComp={Icons.Book} />
      </div>

      {/* Hero card */}
      <div
        style={{
          marginTop: 12,
          background: BUTTER,
          borderRadius: 13,
          padding: "9px 11px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -10,
            bottom: -10,
            opacity: 0.16,
          }}
        >
          <Icons.Video size={68} stroke="var(--ink)" strokeWidth={1.4} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            className="mono lower"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 6px",
              background: "rgba(255,255,255,0.42)",
              borderRadius: 5,
              fontSize: 8.5,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            <Icons.Video size={7} stroke="var(--ink)" strokeWidth={2.4} />
            Канал
          </div>
          <span
            className="mono lower"
            style={{ fontSize: 8.5, fontWeight: 600, color: "var(--ink)" }}
          >
            11:00
          </span>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 7.5,
            fontWeight: 600,
            color: "var(--ink)",
            opacity: 0.62,
            letterSpacing: "0.13em",
            marginTop: 5,
            position: "relative",
          }}
        >
          СЛЕДУЮЩАЯ
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.018em",
            lineHeight: 1.18,
            marginTop: 2,
            position: "relative",
          }}
        >
          Записать черновик ролика
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 8,
            position: "relative",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "5px 0",
              borderRadius: 7,
              background: "var(--ink)",
              color: BUTTER,
              fontSize: 9.5,
              fontWeight: 600,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              letterSpacing: "-0.005em",
            }}
          >
            <Icons.Check size={9} stroke={BUTTER} strokeWidth={2.6} />
            Сделать
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "rgba(255,255,255,0.42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icons.Calendar size={10} stroke="var(--ink)" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Tiny task rows */}
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        <MiniTaskRow
          title="Урок голландского"
          sphere="Голландский"
          color={POOL}
          time="14:00"
        />
        <MiniTaskRow
          title="Купить корм коту"
          sphere="Дом"
          color={MINT}
          time="вчера"
          overdue
        />
      </div>
    </div>
  );
}

function MiniRing({
  color,
  done = false,
  progress = 1,
  IconComp,
}: {
  color: string;
  done?: boolean;
  progress?: number;
  IconComp: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
}) {
  const size = 32;
  const stroke = 2;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink-10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          background: done ? color : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: done ? "var(--ink)" : color,
        }}
      >
        <IconComp size={13} stroke="currentColor" strokeWidth={2} />
      </div>
    </div>
  );
}

function MiniTaskRow({
  title,
  sphere,
  color,
  time,
  overdue,
}: {
  title: string;
  sphere: string;
  color: string;
  time: string;
  overdue?: boolean;
}) {
  return (
    <div
      style={{
        background: overdue ? "rgba(217,106,82,0.06)" : "var(--paper-warm)",
        borderRadius: 9,
        padding: "6px 8px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        border: `1px solid ${overdue ? "rgba(217,106,82,0.18)" : "var(--ink-05)"}`,
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
          <span
            style={{
              fontWeight: 500,
              color: overdue ? "var(--alert)" : "var(--ink-60)",
            }}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

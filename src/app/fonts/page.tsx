import {
  Inter,
  Manrope,
  Onest,
  Geist,
  IBM_Plex_Sans,
  Mulish,
  Source_Sans_3,
  Lora,
} from "next/font/google";

/* Headings stay in Lora (current prod serif) — comparison varies the
   body/sans only, since that's what's everywhere on the screen. */
const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--f-heading",
  weight: ["500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--f-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--f-manrope",
  weight: ["400", "500", "600"],
  display: "swap",
});
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--f-onest",
  weight: ["400", "500", "600"],
  display: "swap",
});
const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--f-geist",
  weight: ["400", "500", "600"],
  display: "swap",
});
const plex = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--f-plex",
  weight: ["400", "500", "600"],
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin", "cyrillic"],
  variable: "--f-mulish",
  weight: ["400", "500", "600"],
  display: "swap",
});
const source = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--f-source",
  weight: ["400", "500", "600"],
  display: "swap",
});

const SAMPLES: { name: string; token: string; note: string }[] = [
  { name: "Inter",         token: "--f-inter",   note: "Сейчас в проде. Нейтральный гротеск, бесхарактерный/чистый." },
  { name: "Geist",         token: "--f-geist",   note: "Vercel. Современный, чуть теплее Inter, чуть характерней." },
  { name: "Onest",         token: "--f-onest",   note: "Что было до Inter. Geist-клон, очень похож." },
  { name: "Manrope",       token: "--f-manrope", note: "Модерный геометрический, чуть округлый, продуктовый." },
  { name: "IBM Plex Sans", token: "--f-plex",    note: "Гуманистический, технологичный, больше характера в формах." },
  { name: "Mulish",        token: "--f-mulish",  note: "Мягкий гуманист, тёплый, journal-friendly." },
  { name: "Source Sans 3", token: "--f-source",  note: "Adobe. Классический гуманист, спокойный, надёжный." },
];

export default function FontsPage() {
  const wrapperClass = [
    lora.variable,
    inter.variable,
    manrope.variable,
    onest.variable,
    geist.variable,
    plex.variable,
    mulish.variable,
    source.variable,
  ].join(" ");

  return (
    <div className={wrapperClass}>
      <div style={{ padding: "16px 22px 32px" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-60)",
            letterSpacing: "-0.005em",
            marginBottom: 8,
          }}
        >
          Сравнение основного (sans) шрифта · 7 семей
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-40)", lineHeight: 1.5 }}>
          Заголовки везде Lora (текущий выбор). Меняется только то, чем
          набрано тело: задачи, метаданные, кнопки, лейблы. Скажи номер.
        </div>
      </div>

      {SAMPLES.map((s, i) => (
        <BodySample key={s.token} index={i + 1} {...s} />
      ))}
    </div>
  );
}

function BodySample({
  index,
  name,
  token,
  note,
}: {
  index: number;
  name: string;
  token: string;
  note: string;
}) {
  const ff = `var(${token})`;
  const headingFf = "var(--f-heading)";

  return (
    <div
      style={{
        padding: "24px 22px 32px",
        borderTop: "1px solid var(--ink-10)",
        fontFamily: ff,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span
          className="tnum"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--mint-deep)",
            letterSpacing: "-0.005em",
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-80)",
            letterSpacing: "-0.005em",
          }}
        >
          {name}
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-60)",
          marginBottom: 18,
          lineHeight: 1.4,
        }}
      >
        {note}
      </div>

      {/* Date label (sans) */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
          marginBottom: 8,
        }}
      >
        вторник, 7 мая
      </div>

      {/* Greeting H1 (serif heading + sans context) */}
      <div
        style={{
          fontFamily: headingFf,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.04,
          color: "var(--ink)",
        }}
      >
        Доброе утро,{" "}
        <span style={{ color: "var(--mint-deep)" }}>Катя</span>!
      </div>

      {/* Subtitle (sans) */}
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink-60)",
          letterSpacing: "-0.005em",
        }}
      >
        12 активных · 1 просрочена
      </div>

      {/* Filter chips (sans) */}
      <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip label="Все" count={12} active />
        <Chip label="Работа" count={3} color="#f4936e" />
        <Chip label="Дом" count={4} color="#86c79a" />
      </div>

      {/* Task rows (sans) */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <TaskRow
          title="Подготовить квартальный отчёт"
          sphere="Работа"
          color="#f4936e"
          due="сегодня"
        />
        <TaskRow
          title="Купить продукты на неделю"
          sphere="Дом"
          color="#86c79a"
          due="вчера"
          overdue
        />
        <TaskRow
          title="Урок голландского с Барбарой"
          sphere="Голландский"
          color="#6ba4c2"
          due="чт"
        />
      </div>

      {/* Streak number (serif) + sans labels */}
      <div
        style={{
          marginTop: 18,
          background: "rgba(134,199,154,0.18)",
          border: "1.5px solid rgba(134,199,154,0.40)",
          borderRadius: 22,
          padding: "16px 18px",
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <div
          className="tnum"
          style={{
            fontFamily: headingFf,
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 0.88,
            color: "var(--ink)",
          }}
        >
          64
        </div>
        <div style={{ paddingBottom: 4 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            дней подряд
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            Пить воду
          </div>
        </div>
      </div>

      {/* Body paragraph */}
      <div
        style={{
          marginTop: 18,
          fontSize: 14,
          fontWeight: 400,
          color: "var(--ink-80)",
          lineHeight: 1.55,
          letterSpacing: "-0.005em",
        }}
      >
        Утром открываешь — на одном экране всё, что нужно сделать. Без
        вкладок и поиска. Жми + чтобы добавить задачу или привычку.
      </div>

      {/* Pill button */}
      <button
        type="button"
        style={{
          marginTop: 14,
          padding: "12px 22px",
          borderRadius: 999,
          background: "var(--mint-deep)",
          color: "#fff",
          border: "none",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          fontFamily: "inherit",
        }}
      >
        Сделать
      </button>
    </div>
  );
}

function Chip({
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
    <span
      style={{
        padding: "7px 12px",
        borderRadius: 10,
        background: active ? "var(--ink)" : "var(--paper-warm)",
        border: `1.5px solid ${active ? "var(--ink)" : "var(--ink-05)"}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {color && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            background: color,
          }}
        />
      )}
      <span
        style={{
          fontSize: 12,
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
          fontSize: 12,
          fontWeight: 500,
          color: active ? "var(--paper)" : "var(--ink-40)",
          opacity: 0.7,
        }}
      >
        {count}
      </span>
    </span>
  );
}

function TaskRow({
  title,
  sphere,
  color,
  due,
  overdue,
}: {
  title: string;
  sphere: string;
  color: string;
  due: string;
  overdue?: boolean;
}) {
  return (
    <div
      style={{
        background: `${color}1F`,
        border: `1px solid ${color}40`,
        borderLeft: overdue ? "3px solid var(--alert)" : `1px solid ${color}40`,
        borderRadius: 16,
        padding: overdue ? "12px 14px 12px 12px" : "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: `2px solid ${color}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 5,
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color,
              letterSpacing: "-0.005em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: color,
              }}
            />
            {sphere}
          </span>
          <span style={{ color: "var(--ink-20)", fontSize: 12 }}>·</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: overdue ? "var(--alert)" : "var(--ink-60)",
              letterSpacing: "-0.005em",
            }}
          >
            {due}
          </span>
        </div>
      </div>
    </div>
  );
}

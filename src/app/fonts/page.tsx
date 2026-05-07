import { Lora, Spectral, Source_Serif_4, Literata, Cormorant_Garamond, EB_Garamond } from "next/font/google";

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--f-lora",
  weight: ["500", "600", "700"],
  display: "swap",
});
const spectral = Spectral({
  subsets: ["latin", "cyrillic"],
  variable: "--f-spectral",
  weight: ["500", "600", "700"],
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  variable: "--f-source",
  weight: ["500", "600", "700"],
  display: "swap",
});
const literata = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--f-literata",
  weight: ["500", "600", "700"],
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--f-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});
const ebgaramond = EB_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--f-ebgaramond",
  weight: ["500", "600", "700"],
  display: "swap",
});

const SAMPLES: { name: string; token: string; note: string }[] = [
  { name: "Lora",              token: "--f-lora",       note: "Сейчас в проде. Мягкий, журнальный, старокнижный." },
  { name: "Spectral",          token: "--f-spectral",   note: "Production Type. Гуманистический, современный." },
  { name: "Source Serif 4",    token: "--f-source",     note: "Adobe. Спокойный, технологичный модерн." },
  { name: "Literata",          token: "--f-literata",   note: "Google Books. Слегка редакторский, нейтральный." },
  { name: "Cormorant Garamond", token: "--f-cormorant", note: "Элегантный, тонкий, ближе к классике." },
  { name: "EB Garamond",       token: "--f-ebgaramond", note: "Classical Garamond. Тёплый, книжный." },
];

export default function FontsPage() {
  const wrapperClass = [
    lora.variable,
    spectral.variable,
    sourceSerif.variable,
    literata.variable,
    cormorant.variable,
    ebgaramond.variable,
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
          Сравнение серифных шрифтов · одинаковый контент в 6 семьях
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-40)", lineHeight: 1.5 }}>
          Прокрути и посмотри какой ложится на тёплую бумагу + мятный акцент.
          Скажи номер — поставлю в прод.
        </div>
      </div>

      {SAMPLES.map((s, i) => (
        <FontSample key={s.token} index={i + 1} {...s} />
      ))}
    </div>
  );
}

function FontSample({
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
  return (
    <div
      style={{
        padding: "24px 22px 32px",
        borderTop: "1px solid var(--ink-10)",
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
          marginBottom: 16,
          lineHeight: 1.4,
        }}
      >
        {note}
      </div>

      {/* H1 sample */}
      <div
        style={{
          fontFamily: ff,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.04,
          color: "var(--ink)",
        }}
      >
        Доброе утро,{" "}
        <span style={{ color: "var(--mint-deep)" }}>Катя</span>!
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-60)",
          marginTop: 6,
          letterSpacing: "-0.005em",
        }}
      >
        вторник, 7 мая
      </div>

      {/* Hero next-task */}
      <div
        style={{
          marginTop: 14,
          background: "var(--peach)",
          borderRadius: 22,
          padding: "16px 18px 18px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            opacity: 0.7,
            letterSpacing: "-0.005em",
          }}
        >
          11:00
        </div>
        <div
          style={{
            fontFamily: ff,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.18,
            color: "var(--ink)",
            marginTop: 6,
          }}
        >
          Подготовить квартальный отчёт
        </div>
      </div>

      {/* Streak number */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", gap: 14 }}>
        <div
          className="tnum"
          style={{
            fontFamily: ff,
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 0.88,
            color: "var(--ink)",
          }}
        >
          64
        </div>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 12, color: "var(--ink-60)" }}>дней подряд</div>
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

      {/* Multiple H1s in row */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "var(--paper-warm)",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid var(--ink-05)",
        }}
      >
        <div
          style={{
            fontFamily: ff,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          Задачи
        </div>
        <div
          style={{
            fontFamily: ff,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          Привычки
        </div>
        <div
          style={{
            fontFamily: ff,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          Настройки
        </div>
      </div>
    </div>
  );
}

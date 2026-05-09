# Дизайн-направление: hotel-finder

## Концепция

Не «дашборд», не «маркетплейс», не «search results». Эстетика — **личный travel-diary**: каждый поиск похож на разворот в тетради путешественницы, где аккуратно отобраны несколько мест и про каждое есть короткая личная пометка.

Ощущение должно быть «куратор сделал работу за меня», а не «алгоритм выплюнул список».

## Референсы

- **Cereal Magazine** — серьёзная типографика, крупные фото, воздух
- **Kinfolk Travel** — спокойная палитра, editorial-выкладка
- **Airbnb «Neighborhood Guides»** (старые версии) — сбалансированные карточки + личный тон
- **Are.na** — минимализм без стерильности
- **The New York Times Travel** — strong serif headlines + supporting sans body

## Палитра

Тёплая бумажная, с одним глубоким акцентом для «top pick» / выбранного.

```
--paper            #f8f4ee   /* основной фон, тёплая аged-paper */
--paper-warm       #efe7d8   /* surfaces под выделенными карточками */
--paper-soft       #faf7f1   /* нежная альтернатива paper */

--ink              #1a1614   /* warm black, основной текст */
--ink-soft         #5a534b   /* secondary text, метаданные */
--ink-mute         #8a8278   /* третий уровень — captions, chips */

--rule             #e6dfd3   /* hairlines, dividers */
--rule-soft        #f0e9dc

--accent           #b85c3a   /* терракота — для top pick, scores в верхней зоне */
--accent-soft      #d8a890   /* tinted version */

--moss             #6b7c5a   /* second accent — для chip-меток субъективных критериев */
--sky              #6e8aa3   /* third accent — для location-меток */
```

Никакого холодного синего/фиолетового SaaS-палиттера. Никаких neon-теней.

## Типографика

**Display: Fraunces (Google Fonts).** Современный contemporary serif с опционным `opsz` axis. Используется для всех заголовков, hero-цифр, акцентных цитат-врезок. Italic у Fraunces — выразительная, идеально для «личных» заметок-аннотаций.

**Body: Inter (Google Fonts).** Чистый sans-serif для всего UI и body-текста. Достаточно нейтральный, чтобы не конкурировать с Fraunces.

```
/* Type scale */
--font-display: 'Fraunces', Georgia, serif;
--font-body:    'Inter', system-ui, sans-serif;

/* Display sizes */
.text-hero      { font: 400 64px/1.05 var(--font-display); letter-spacing: -0.025em; font-variation-settings: 'opsz' 144; }
.text-display   { font: 500 44px/1.1 var(--font-display);  letter-spacing: -0.02em;  font-variation-settings: 'opsz' 96; }
.text-h1        { font: 600 28px/1.2 var(--font-display);  letter-spacing: -0.015em; font-variation-settings: 'opsz' 48; }
.text-h2        { font: 600 20px/1.3 var(--font-display);  letter-spacing: -0.01em;  font-variation-settings: 'opsz' 24; }

/* Editorial / personal voice */
.text-quote     { font: italic 400 20px/1.5 var(--font-display); }
.text-margin    { font: italic 400 15px/1.55 var(--font-display); color: var(--ink-soft); }

/* Body */
.text-body      { font: 400 16px/1.55 var(--font-body); }
.text-small     { font: 400 14px/1.5 var(--font-body); }
.text-meta      { font: 500 12px/1.4 var(--font-body); color: var(--ink-mute); }

/* Eyebrow / labels */
.text-eyebrow   { font: 600 11px/1 var(--font-body); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-mute); }
```

## Layout страницы поездки

```
┌──────────────────────────────────────────────────┐
│  [eyebrow] ПОЕЗДКА · 3 НОЧИ                      │
│                                                  │
│  Севилья                          [hero serif]   │
│  12 — 15 июня 2026                               │
│                                                  │
│  [ italic margin note: "из 47 проверенных" ]    │
│                                                  │
│ ──────────────────────────────────────────────── │
│                                                  │
│  ВЫБОР № 1                                       │
│                                                  │
│  [               full-bleed photo               ]│
│                                                  │
│  Hotel Casa 1800 Sevilla                         │
│  «Boutique в патио XVIII века. Уютный, светлый,  │
│   с rooftop-террасой — сильное соответствие.»   │
│                                                  │
│  [chip: уют 9] [chip: свет 8] [chip: outdoor 8]  │
│  [chip: location 9.4]  $1,274 · 4.7★             │
│                                                  │
│  [ Открыть на Booking → ]                        │
│                                                  │
│ ──────────────────────────────────────────────── │
│                                                  │
│  ВЫБОР № 2 · 3                                   │
│  [photo] [photo]                                 │
│  Hotel Monte    Las Casas de la                  │
│  Carmelo        Juderia                          │
│  ...            ...                              │
│                                                  │
│ ──────────────────────────────────────────────── │
│                                                  │
│  ОСТАЛЬНЫЕ В ШОРТ-ЛИСТЕ                          │
│  [smaller cards в сетке 2×3]                     │
│                                                  │
│ ──────────────────────────────────────────────── │
│                                                  │
│  ▸ Отвергнутые (12) — почему                    │
│  [ accordion ]                                   │
└──────────────────────────────────────────────────┘
```

Mobile: всё одной колонкой, top-3 — каждый full-bleed по очереди.

## Карточка отеля — анатомия

Главная карточка («top pick») — **full-bleed photo + текст под ним**, не overlay:
- Photo: 4:3, без border-radius (или очень мягкий 4px, опционально)
- Под фото: 24px вертикального воздуха перед текстом
- Название: `text-h1` (Fraunces 28px)
- Аннотация LLM: `text-quote` italic, в 1–2 предложениях
- Pills с скорами: `text-meta`, тёплый paper-warm фон, скруглённые мягко
- Цена + рейтинг: правее в строке мета, не attention-grabbing
- CTA: подчёркнутая ссылка с arrow, не button. Hover — терракотовый цвет.

Меньшие карточки (выбор №2, №3, шорт-лист):
- Photo 4:3, текст справа на десктопе / снизу на мобилке
- Аннотация короче — одной фразой
- Меньше chip-ов

## Главная страница (лента поездок)

```
┌──────────────────────────────────────────────────┐
│  Поездки                              [+ Новая]  │
│                                                  │
│  [photo]  Севилья                                │
│           12—15 июня 2026 · 3 ночи               │
│           «10 отелей выбрано, top: Casa 1800»    │
│                                                  │
│  [photo]  Стамбул                                │
│           5—10 мая 2026 · 5 ночей                │
│           ...                                    │
└──────────────────────────────────────────────────┘
```

## Anti-patterns — чего избегать

- ❌ Border на card-ах (особенно `border-gray-200`) — paper-feel ломается
- ❌ Box-shadow с большой подложкой
- ❌ Emoji в качестве иконок (✈️🏨⭐)
- ❌ Цветные иконки от Heroicons/Lucide в стиле SaaS
- ❌ Centered-everything — текст слева, hierarchy через размер
- ❌ Звёздочки (★★★★☆) для рейтингов — слишком cliché. Вместо этого: «4.7» как число
- ❌ Бесконечный scroll / infinite list — список ограничен топ-10 + аккордеон
- ❌ «Tags» в виде pillows с цветным фоном радуги
- ❌ Buttons с gradient-фоном

## Detail-уровневые вещи (важно для product-feel)

- **Smart typography**: em-dash `—` (не два дефиса), curly quotes `«»` (не `""`), правильная минута `'` (не апостроф), nbsp перед единицами (`12 нм`, `4.7 ★`).
- **Tabular figures** для цен и рейтингов: `font-variant-numeric: tabular-nums`.
- **Контент-driven hierarchy**: важное — крупно, остальное — мелко. Никаких boxes для всего.
- **Hover-эффекты subtle**: на ссылках только цвет, никаких фоновых свечений.
- **Photo proportions consistent**: все 4:3 или все 16:9, не миксовать.

## Что зафиксировано

Перед переходом к Astro мокап `mockup/index.html` должен **выглядеть как продукт** — будем смотреть на телефоне и оценивать. Если что-то выглядит generic — переделать на этом этапе, а не после построения всего сайта.

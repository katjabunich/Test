# Полный контекст для нового чата по DoIt

## Что это за приложение

**DoIt** (раньше «Dela») — персональный PWA-таск-трекер + habit-tracker для одного пользователя. Русскоязычный. Стек: **Next.js 16** (App Router, Turbopack) + **React** + **TypeScript** + **Supabase** (Postgres + auth). Деплой на **Vercel**: `doit-tracker.vercel.app` (старый алиас `test-self-iota-45.vercel.app` тоже работает).

Концепция — приложение для одного человека (пользовательница katjabunich, она же katja), не SaaS. Цель — выйти из категории «бесплатное хобби-приложение» в категорию «приложение, за которое платят €10/мес».

### Главные сущности
- **Sphere** (сфера жизни) — категория с цветом + иконкой. Дефолтные сферы: Работа / Канал / Дом / Голландский / AI. Пользователь может создавать кастомные.
- **Task** — задача. Поля: title, sphere_id (nullable), due_date, do_today (bool), note, recurrence (daily/weekly/biweekly/monthly).
- **Habit** — привычка. Поля: name, emoji (или `:IconKey` для built-in SVG), color, schedule_type (daily/weekdays/n_per_week), schedule_value.
- **HabitLog** — день когда привычка отмечена выполненной.

### Структура страниц
- `/` — Today: приветствие + дата + habit rings + hero «next task» (большая цветная карточка с кнопкой «Сделать») + остальные задачи на сегодня
- `/tasks` — все задачи, сгруппированные по срокам (Просрочено / Сегодня / На неделе / Позже / Без даты), фильтр по сфере
- `/habits` — все привычки, mint full-bleed hero с лучшим страйком, список карточек, кнопка «+ Добавить привычку»
- `/settings` — управление сферами + toggle Звуки/Вибрация + disabled placeholder для PWA/Notifications/Cloud

### Дизайн-язык
- **Палитра тёплая paper-based**: `--paper #f5ede0`, `--paper-warm #ede0cd`, `--paper-deep #e3d4ba`, `--ink #2d2620`, `--ink-strong #1f1813`
- **Sphere accent colors**: mint `#86c79a` / mint-deep `#4f9c6a` / lilac `#b5a3df` / peach `#f4936e` / blush `#e89bb0` / butter `#f5c563` / pool `#6ba4c2` / alert `#d96a52`
- **Типографика**: Lora (serif, weights 500/600/700) для эмоциональных моментов — H1, hero titles, страйк-цифры; Manrope (sans, 400/500/600/700) для body, UI, чисел
- **CTA-стратегия**:
  - `--ink-strong` — для next-step кнопок («Готово» в edit-модалках, «Дальше» / «Готова, поехали» в онбординге)
  - `--mint-deep` — для in-place positive actions (FAB `+`, «Сделать» в hero, чекмарки в TaskItem, выбранный sphere chip)

### Ключевые файлы и где что лежит

```
src/
├── app/
│   ├── globals.css              # CSS-токены, .mark-butter, анимации
│   ├── layout.tsx                # шрифты Lora+Manrope, BottomNav, Splash, Onboarding
│   ├── TodayView.tsx             # главная: greeting + рингы + hero next task
│   ├── tasks/TasksView.tsx
│   ├── habits/HabitsView.tsx
│   └── settings/SettingsView.tsx
├── components/
│   ├── Icons.tsx                 # вся иконография — sphere icons, habit preset icons, Volume, Vibrate, и т.д.
│   ├── BottomNav.tsx             # 4 таб-линка + central FAB (на текущем pathname?new=1 → каждая страница ловит и открывает модалку)
│   ├── Onboarding.tsx            # 3 слайда с full-bleed PNG + bottom card; flag dela.onboarded.v1
│   ├── SplashScreen.tsx          # cinematic sunrise при первом заходе сессии (sessionStorage dela.splashShown)
│   ├── HabitRing.tsx             # маленький круг на Today
│   ├── HabitCard.tsx             # карточка в /habits
│   ├── TaskItem.tsx              # строка задачи
│   ├── TaskEditModal.tsx
│   ├── HabitEditModal.tsx
│   └── SphereEditModal.tsx
├── lib/
│   ├── data.ts                   # типы Sphere/Task/Habit/HabitLog
│   ├── actions.ts                # server actions: createTask/completeTask/toggleHabitLog/...
│   ├── habits.ts                 # computeStreak, isStreakMilestone, isScheduledOn, groupLogsByHabit
│   ├── celebrate.ts              # fireConfetti
│   ├── date.ts                   # today, fromIsoDate, addDays, isPast, isToday
│   └── feedback.ts               # Web Audio + Vibration micro-feedback
└── public/
    └── illustrations/
        ├── onboarding-morning.jpg
        ├── onboarding-spheres.jpg
        └── onboarding-streak.jpg
```

---

## Что было сделано в v6 (последний релиз)

Бранч: **`claude/task-tracker-app-LqhzE`**
Последний коммит: **`fb5acc7`**

### Цепочка коммитов

| SHA | Что |
|---|---|
| `8d39364` | v6 part 1: sphere icons / sound module / palette warming / mint hero / butter highlights / empty states / typography / Settings toggles |
| `2f35bed` | Onboarding rewrite — full-bleed PNG layout, удалены 9 файлов в `src/components/onboarding/` |
| `244a001` | placeholder folder `public/illustrations/` |
| `68b70fd` | 3 nano-banana иллюстрации добавлены (.jpg) |
| `0a3bcce` | Crop top of morning (18%) and streak (12%) — клипинг исправлен |
| `8c61dd6` | Sound redesign — wood-tap + soft chime, не beeps |
| `fb5acc7` | AudioContext.resume / iOS haptic fallback / habit CTA / стрик→страйк |

### A. Иконография

**Sphere icons** в `Icons.tsx` (Briefcase/Home/Video/Globe/Cpu — namespace сохранён, но визуал переписан вручную):
- Briefcase = чашка кофе с паром (Работа)
- Home = домик с трубой (Дом)
- Video = микрофон с волной (Канал)
- Globe = тюльпан (Голландский)
- Cpu = искра-sparkle (AI)

**Новые иконки**: Volume (динамик с волнами) и Vibrate (телефон с motion lines) — для Settings toggle-rows.

**Empty state SVG**:
- Tasks (нет задач): мини-восход + пустая строка списка
- Tasks (фильтр пустой): круг в цвете сферы + 3 точки сбоку
- Habits: progress-дуга + точка
- Settings (нет сфер): созвездие из 3 цветных точек

### B. Sound + Haptic (`src/lib/feedback.ts`)

Программно генерируемый звук через **Web Audio API** (никаких MP3-ассетов):

- `playTick()` — деревянный тап: 12ms lowpass-filtered noise click + 50ms low sine body с pitch dip 240→180Hz. Используется при чеке задачи/привычки.
- `playPop()` — soft thup: 50ms band-limited noise puff (lowpass 900→300Hz). Используется при открытии edit-модалок.
- `playCelebrate()` — soft chime: D5 + A5 + D6 partials с разной длиной хвоста (0.9s/0.55s/0.35s) — bell shimmer. Используется при стрик-milestone (3/7/14/30/60/100/365 дней).
- `playWhoosh()` — bandpass noise sweep 1800→280Hz. **Сейчас не вызывается нигде** (был на splash, но AudioContext не успевал инициализироваться).

**`AudioContext.resume()`** вызывается в `getCtx()` если state === "suspended". Без этого первый тап на iOS Safari silent-no-op.

**Vibration**:
- `navigator.vibrate(pattern)` — работает на Android Chrome/Firefox
- iOS fallback: hidden `<input type="checkbox">` + `el.click()` — иногда триггерит native selection-haptic в **PWA standalone mode** (после Share → «На главный»). В обычной Safari-вкладке iOS вибрация **невозможна** в принципе — Apple запрет, ничего не сделать.

**Настройки** в `localStorage`:
- `dela.sound` = "on" / "off" (default "on")
- `dela.haptic` = "on" / "off" (default "on")

UI-toggles в `/settings` — два рядка между «Установить на главный» и «Уведомления».

### C. Editorial-сдвиги

- **Палитра теплее**: paper `#fbf6ee → #f5ede0`, warm/deep пропорционально
- **Новый токен** `--ink-strong: #1f1813` — глубокий коричневый для next-step CTA
- **H1 везде**: Lora 700 / 40px / letter-spacing -0.03em
- **Hero next-task title**: 28px / Lora 700
- **`/habits` hero** — full-bleed solid `var(--mint)`, paper-цвет текст, 118×118px paper-кольцо с 76px страйк-цифрой по центру (декоративная HabitIcon в углу opacity 0.25)
- **`.mark-butter`** утилита — editorial highlight маркер (полупрозрачный butter градиент сзади). Применён точечно: empty states + butter-highlight на ключевых словах в онбординге

### D. Онбординг — полная переписка

`src/components/Onboarding.tsx` (459 → 232 строки):

- Удалён phone-mockup паттерн целиком
- 9 файлов в `src/components/onboarding/` удалены: `PhoneFrame.tsx`, `HeroPreview.tsx`, `SpheresPreview.tsx`, `RingPreview.tsx`, `MockTodayContent.tsx`, `MockTasksContent.tsx`, `MockHabitContent.tsx`, `FloatingDecor.tsx`, `SlideBackground.tsx`
- **Новый layout**: top-right Skip + full-bleed PNG (62% viewport) + bottom card 28px rounded-top (38% viewport) с chip `1/3` + Lora-700 заголовком + butter-highlight body + pagination dots + ink-strong CTA full-width
- 3 слайда:
  1. «Утро без хаоса» / «На <mark>одном экране</mark> всё, что нужно сделать сегодня.» / Дальше
  2. «Сферы жизни» / «Работа, дом, отдых — у каждой <mark>свой цвет</mark>.» / Дальше
  3. «День за днём» / «Привычки растут <mark>страйком</mark> — день за днём.» / Готова, поехали
- 3 PNG-иллюстрации (от пользовательницы из nano banana): женщина за столом / женщина в кресле с дневником / женщина бежит по тропе. Лежат в `public/illustrations/onboarding-{morning,spheres,streak}.jpg`.
- Image 1 кропнут сверху на 18%, image 3 — на 12%, чтобы под bottom-card не уходили важные части сцены
- Свайпы влево/вправо листают; флаг `dela.onboarded.v1` в localStorage

### E. /habits — кнопка «+ Добавить привычку»

В дополнение к BottomNav FAB, добавлена явная кнопка:
- В empty state: ink-strong кнопка под текстом «Создай первую привычку»
- Под списком привычек: dashed-outline кнопка во всю ширину (симметрично с `/settings` «+ Добавить сферу»)

### F. Терминология

- **«стрик» → «страйк»** в копирайте (`/habits` hero label «Лучший страйк», онбординг slide 3 «растут страйком»)

---

## Известные ограничения / нерешённое

1. **iOS haptic в обычной Safari-вкладке не работает** — Apple запрет. Hidden-checkbox фолбэк помогает только в PWA standalone (после Share → «На главный»). Для полной поддержки нужно нативное приложение.
2. **AudioContext** на iOS первый раз требует user gesture — теперь работает после `resume()`, но это надо помнить если рефакторить.
3. **Custom date picker в TaskEditModal** — сейчас нативный `<input type="date">` рендерится по-разному в Safari/Chrome/Firefox. Не критично, но можно переделать (~150 строк отдельного компонента).
4. **HabitCard стрик-цифра** — 28px Manrope. Для согласованности с `/habits` hero (Lora 700) можно переключить на Lora.

---

## ⚠️ TODO: техдолг, напомнить Кате при следующем заходе

**Старый DB-триггер `on_auth_user_created` в Supabase до сих пор засеивает её личные дефолты** (Голландский / Канал / AI / Работа / Дом). Сейчас обходим костылём в `src/app/login/actions.ts` → функция `reseedSpheres`: после регистрации делаем `delete spheres → insert новые 3`. Костыль на 8 лишних запросов в БД на регистрацию.

**Когда Катя в следующий раз попросит правку — напомни почистить триггер**, выполнив SQL в Supabase SQL Editor (см. ниже). После этого можно удалить `reseedSpheres` и оставить чистый код.

```sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare user_lang text := coalesce(new.raw_user_meta_data->>'lang', 'ru');
begin
  if new.email_confirmed_at is null then
    update auth.users set email_confirmed_at = now() where id = new.id;
  end if;
  if user_lang = 'en' then
    insert into public.spheres (user_id, name, color, emoji, position) values
      (new.id, 'Work',     '#f4936e', '💼', 0),
      (new.id, 'Home',     '#86c79a', '🏡', 1),
      (new.id, 'Personal', '#b5a3df', '🌿', 2);
  else
    insert into public.spheres (user_id, name, color, emoji, position) values
      (new.id, 'Работа', '#f4936e', '💼', 0),
      (new.id, 'Дом',    '#86c79a', '🏡', 1),
      (new.id, 'Личное', '#b5a3df', '🌿', 2);
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

После выполнения этого SQL → удалить `reseedSpheres` из `src/app/login/actions.ts` и убрать его вызов.

---

## Что вне scope v6 (потенциальные следующие релизы)

- **Dark mode** — большая фича, отдельным релизом. Сейчас токены под light-only, нужна `prefers-color-scheme` реструктуризация
- **Data viz** — calendar heatmap привычек, streak charts, weekly breakdown
- **Push-notifications** — реальные напоминания через Service Worker + Web Push API (сейчас в Settings показано как disabled placeholder)
- **Cloud sync / multi-device** — Supabase auth + RLS уже есть, но сейчас приложение для одного юзера; нужно вынести на multi-account flow
- **Drag-to-reorder** для задач/привычек
- **Widget support** для iOS PWA — ограничено, но возможно
- **End-of-day review** screen — какой-то Zenly-style summary

---

## Workflow в этом проекте

- **Бранч**: `claude/task-tracker-app-LqhzE` (любая разработка туда)
- **Деплой**: `git push origin claude/task-tracker-app-LqhzE` → Vercel auto-deploy через ~2 мин на `doit-tracker.vercel.app`
- **Катя работает только с телефона через Vercel** — никакого `npm run dev` локально, никакого `.env.local`. Все env-переменные настраиваются через Vercel UI.
- **Build**: `cd /home/user/Test && npm run build` (Turbopack, ~10s) — для локальной валидации перед коммитом
- **Никаких миграций без явного запроса** — Supabase schema стабильна. Если правка требует SQL — спросить Катю (она не знает SQL, но может выполнить готовый блок в Supabase SQL Editor).
- **Всегда коммит + push без merge в main** — пользовательница смотрит превью
- **Перед коммитом**: запустить `npm run build`, убедиться что TypeScript проходит
- **Commit сообщения**: концептуальные, со ссылкой на Claude session URL в конце через HEREDOC

### Аутентификация и регистрация

- **Email + пароль** (Google убран — был на signin/signup, теперь нет, чтобы не обходить инвайт-гейт).
- **Инвайт-код**: при регистрации требуется код из env-переменной `INVITE_CODES` (server-only, comma-separated, case-insensitive). Сравнение в `src/lib/env.ts → checkInviteCode()`. Текущий код в Vercel — спросить у Кати если нужен.
- **Локализация дефолтных сфер**: язык интерфейса на момент регистрации улетает в `raw_user_meta_data->lang`; функция `reseedSpheres` в `src/app/login/actions.ts` создаёт дефолты на этом языке.

---

## Контекст пользовательницы

Она работает с телефона, не любит лишние шаги (загружать файлы куда-то, переименовывать через файловый менеджер), хочет чтобы я делала всё сама. **Картинки которые она прикрепляет в чате** можно достать из `~/.claude/projects/-home-user/<session-id>.jsonl` — там сохраняется вся история сессии включая base64 attachments. Скрипт для извлечения:

```python
import json, base64, os
session_file = "/root/.claude/projects/-home-user/<SESSION_ID>.jsonl"
out_dir = "/tmp/extracted_images"
os.makedirs(out_dir, exist_ok=True)
def walk(node):
    if isinstance(node, dict):
        if node.get("type") == "image":
            src = node.get("source", {})
            data, media = src.get("data"), src.get("media_type", "image/png")
            if data:
                ext = media.split("/")[-1]
                with open(f"{out_dir}/{hash(data)}.{ext}", "wb") as o:
                    o.write(base64.b64decode(data))
        for v in node.values(): walk(v)
    elif isinstance(node, list):
        for v in node: walk(v)
with open(session_file) as f:
    for line in f:
        try: walk(json.loads(line))
        except: pass
```

`SESSION_ID` берётся из `$CLAUDE_CODE_SESSION_ID`.

Терминология её предпочтений:
- «страйк» (не «стрик»)
- Тёплая земляная палитра, не cold blue
- Premium-feel: тонкие тени, organic sounds, subtle animations
- Editorial-стиль: heavy serif H1, butter highlights на ключевых словах, dark CTA

---

## План-файл

`~/.claude/plans/expressive-wibbling-map.md` — финальный плановый документ v6 со всем контекстом, решениями, файлами, verification. Можно прочитать если нужны детали по конкретному пункту.

---

## Точка входа в новый чат

Для нового чата начни с:

> Я работаю над DoIt — Next.js + Supabase персональным task/habit-трекером. Бранч `claude/task-tracker-app-LqhzE`, последний коммит `fb5acc7`. v6 закрыт (custom iconography + sound/haptic + editorial palette + onboarding rewrite). Прочти `/home/user/Test/HANDOFF.md` для полного контекста. Хочу [тема]: [короткое описание].

Темы которые имеют смысл следующими: **dark mode**, **data viz для привычек** (heatmap/streak charts), **push-notifications**, **multi-device sync**, или конкретные баги/полировка.

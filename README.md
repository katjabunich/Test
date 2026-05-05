# Дела — личный task tracker (v1)

PWA для задач, привычек и сфер жизни. Один экран «Сегодня», стеклянные карточки на белом фоне, мятный акцент Tiffany.

## Стек

- Next.js 16 (App Router) + React 19, TypeScript strict
- Tailwind CSS 4 + CSS-переменные
- Supabase (`@supabase/ssr`) — таблицы в проекте `plant-app`, изолированы по `user_id`
- Server Actions для мутаций
- Manual PWA (`public/manifest.json` + `public/sw.js`)

## Запуск локально

```sh
npm install
cp .env.example .env.local   # заполнить ключами Supabase
npm run dev                  # http://localhost:3000
```

`.env.local` (значения уже есть в задеплоенном проекте Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://guypbszfncsskkqmfzfp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

## Структура

```
src/
  app/
    page.tsx          Сегодня (главный)
    tasks/            Все задачи
    habits/           Привычки
    settings/         Настройки сфер
  components/         BottomNav, GlassCard, TaskItem, HabitRing, …
  lib/
    supabase/         клиенты SSR
    db.ts             read-запросы
    actions.ts        server actions (write)
    constants.ts      DEV_USER_ID + дефолтные сферы
    data.ts           типы
    date.ts           работа с датами
    recurrence.ts     повторяемость задач
    habits.ts         streak, расписание
public/
  manifest.json
  sw.js
  icon-192.png  icon-512.png
  icon.svg          (исходник для иконок)
scripts/
  build-icons.mjs   `node scripts/build-icons.mjs` — пересобрать иконки из SVG
```

## v1 → v2

В v1 приложение однопользовательское, без логина: все данные пишутся под захардкоженным `DEV_USER_ID` (см. `lib/constants.ts`). URL приложения — единственная защита.

В v2 планируется:

- Supabase auth (магическая ссылка / OTP) + RLS-политики
- Стратегический слой: цели → проекты → задачи
- Splash-анимация при запуске
- Подзадачи, приоритеты
- Push-нотификации
- Оффлайн-очередь записи
- Десктоп-адаптив

## База данных

Таблицы `spheres`, `tasks`, `habits`, `habit_logs` живут в Supabase-проекте `plant-app` (`guypbszfncsskkqmfzfp`). Они изолированы от данных plant-app по `user_id`. Если позже понадобится отдельный проект — миграция простая: выгрузить эти 4 таблицы и залить в новый.

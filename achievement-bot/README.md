# Дневник достижений — Telegram-бот

Личный бот, в который ты записываешь хорошее, что случилось **благодаря тебе**.
Сам напоминает по вечерам, раз в неделю присылает сводку, по запросу делает
AI-разбор твоих сильных сторон. Работает **только с владельцем** — чужие не
видят ничего.

## Что умеет

| Действие | Как |
|---|---|
| Записать достижение | просто написать боту |
| Уточнить свою роль | кнопка «✍️ Допишу» после записи (иногда) |
| Сводка за неделю | `/week` (+ автоматически по воскресеньям) |
| AI-разбор паттернов | `/итоги` (нужен ключ Claude API) |
| Выгрузить всё | `/export` → текстовый файл |
| Время напоминания | `/time 21:00` |
| Пауза / включить | `/pause` · `/resume` |

## Архитектура

- **Supabase Postgres** — таблицы `bot_users`, `entries` (RLS включён, доступ
  только у Edge Functions через service_role; снаружи — ноль).
- **Edge Function `bot`** — webhook Телеграма (запись, команды, кнопки).
- **Edge Function `cron`** — вечерние напоминания и недельная сводка.
- **pg_cron** — тикает каждый час и дёргает `cron`.
- **Claude API** (опц.) — `/итоги`, модель Haiku (копейки; стартовых $5 хватает надолго).

Схема многопользовательская «изнутри», но запуск — для одного владельца
(белый список по `OWNER_TELEGRAM_ID`).

## Безопасность

- **Белый список из одного человека.** Бот обслуживает только `OWNER_TELEGRAM_ID`.
  Любой другой получает «Это личный бот» и не может ни писать, ни читать.
- **Подпись webhook'а.** Телеграм шлёт секрет в заголовке
  `x-telegram-bot-api-secret-token`; чужой POST отбрасывается.
- **Секрет cron'а** в заголовке — функцию не дёрнуть снаружи.
- **Секреты только на сервере** (`supabase secrets`), в git не попадают.
- **База закрыта наружу** (RLS, без публичных политик).

## Развёртывание

Нужен [Supabase CLI](https://supabase.com/docs/guides/cli) и токен бота.

### 1. Создать бота
В Телеграме → **@BotFather** → `/newbot` → получить **токен**.
Там же: `/setprivacy` → Enable, и `/setjoingroups` → Disable (бот только в личке).

### 2. Узнать свой Telegram ID
Написать боту **@userinfobot** — он пришлёт твой числовой `id`. Это `OWNER_TELEGRAM_ID`.

### 3. Линкуем проект и применяем схему
```sh
supabase link --project-ref <PROJECT_REF>
supabase db push                       # применит миграцию из supabase/migrations
```

### 4. Секреты
```sh
supabase secrets set \
  TELEGRAM_BOT_TOKEN=... \
  OWNER_TELEGRAM_ID=... \
  TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 24) \
  CRON_SECRET=$(openssl rand -hex 24) \
  ANTHROPIC_API_KEY=sk-ant-...         # опционально
```
(сохрани значения `TELEGRAM_WEBHOOK_SECRET` и `CRON_SECRET` — пригодятся ниже)

### 5. Деплой функций
```sh
supabase functions deploy bot
supabase functions deploy cron
```

### 6. Подключить webhook Телеграма
```sh
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_REF>.functions.supabase.co/bot" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

### 7. Включить расписание
В дашборде Supabase → Database → Extensions включить `pg_cron` и `pg_net`,
затем выполнить `supabase/schedule.sql` (подставив `<PROJECT_REF>` и `<CRON_SECRET>`).

### 8. Проверить
Написать боту `/start`. Готово ✨

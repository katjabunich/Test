-- Achievement bot — начальная схема
-- Личный дневник достижений в Телеграме. Многопользовательская схема «изнутри»
-- (таблица users + изоляция записей по user_id), но запуск — для одного владельца.

-- ── Пользователи ─────────────────────────────────────────────────────────────
create table if not exists public.bot_users (
  id              uuid primary key default gen_random_uuid(),
  telegram_id     bigint unique not null,          -- постоянный ID человека в Телеграме
  chat_id         bigint not null,                 -- куда слать сообщения
  first_name      text,
  is_owner        boolean not null default false,  -- белый список: обслуживаем только владельца
  -- настройки напоминаний
  reminder_enabled boolean not null default true,
  reminder_hour    smallint not null default 21,   -- локальный час (0..23)
  timezone         text not null default 'Europe/Amsterdam',
  -- лёгкое состояние диалога: ждём ли уточнение «в чём заслуга» к записи
  awaiting_agency_for uuid,                         -- id записи, к которой ждём приписку
  last_reminded_on    date,                         -- защита от повторного пинга в тот же день
  last_weekly_on      date,                         -- когда в последний раз слали недельную сводку
  created_at      timestamptz not null default now()
);

-- ── Записи (достижения) ──────────────────────────────────────────────────────
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.bot_users(id) on delete cascade,
  body        text not null,                       -- сама запись
  agency_note text,                                -- «в чём была моя заслуга» (опционально)
  source      text not null default 'manual',      -- 'manual' | 'reminder'
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc);

-- ── Безопасность ─────────────────────────────────────────────────────────────
-- RLS включён, политик для anon/authenticated НЕТ намеренно: в таблицы ходит
-- только Edge Function под service_role (он обходит RLS). Снаружи — ноль доступа.
alter table public.bot_users enable row level security;
alter table public.entries   enable row level security;

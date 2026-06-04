-- Дневник достижений — изолированная схема внутри общего проекта.
-- Отдельная схема = чисто и бесплатно (не плодим проекты-серверы).

create schema if not exists achievements;

-- ── Пользователи ─────────────────────────────────────────────────────────────
create table if not exists achievements.users (
  id              uuid primary key default gen_random_uuid(),
  telegram_id     bigint unique not null,
  chat_id         bigint not null,
  first_name      text,
  is_owner        boolean not null default false,
  reminder_enabled boolean not null default true,
  reminder_hour    smallint not null default 21,
  timezone         text not null default 'Europe/Amsterdam',
  awaiting_agency_for uuid,
  last_reminded_on    date,
  last_weekly_on      date,
  created_at      timestamptz not null default now()
);

-- ── Записи (достижения) ──────────────────────────────────────────────────────
create table if not exists achievements.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references achievements.users(id) on delete cascade,
  body        text not null,
  agency_note text,
  source      text not null default 'manual',
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_created_idx
  on achievements.entries (user_id, created_at desc);

-- ── Конфиг (секреты бота) ────────────────────────────────────────────────────
-- Хранится в БД, потому что у Edge Functions нет иного безопасного места в этой
-- установке. Читает только серверная функция через service_role.
create table if not exists achievements.config (
  id                 boolean primary key default true,         -- ровно одна строка
  telegram_bot_token text not null,
  owner_telegram_id  bigint not null,
  webhook_secret     text not null,
  cron_secret        text not null,
  anthropic_api_key  text,
  anthropic_model    text not null default 'claude-haiku-4-5-20251001',
  constraint config_singleton check (id)
);

-- ── Безопасность ─────────────────────────────────────────────────────────────
-- RLS включён, политик нет: схема не отдаётся в PostgREST, ходит только функция
-- под service_role (обходит RLS). Снаружи доступа ноль.
alter table achievements.users   enable row level security;
alter table achievements.entries enable row level security;
alter table achievements.config  enable row level security;

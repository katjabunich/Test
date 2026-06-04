-- Расписание вечерних напоминаний и недельных сводок.
-- Запускается ОДИН РАЗ после деплоя функций. Требует расширений pg_cron и pg_net.
--
-- Подставь <PROJECT_REF> — ref проекта Supabase (из URL дашборда).
-- Секрет НЕ хардкодим: берём его из achievements.config прямо во время вызова.
--
-- Крон тикает каждый час; функция achv-cron сама решает, кому слать сейчас
-- (по локальному времени пользователя).

select cron.schedule(
  'achievement-hourly-tick',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/achv-cron',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', (select cron_secret from achievements.config limit 1)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Посмотреть задания:   select * from cron.job;
-- Удалить:              select cron.unschedule('achievement-hourly-tick');

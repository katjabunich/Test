-- Расписание для напоминаний. Запустить ОДИН РАЗ после деплоя функций.
-- Требует расширений pg_cron и pg_net (включаются в дашборде Supabase: Database → Extensions).
--
-- Перед запуском подставь:
--   <PROJECT_REF>  — ref проекта Supabase (из URL)
--   <CRON_SECRET>  — то же значение, что в секрете функции CRON_SECRET
--
-- Крон тикает каждый час; сама функция решает, кому именно сейчас слать
-- (по локальному времени пользователя).

select cron.schedule(
  'achievement-hourly-tick',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Посмотреть задания:   select * from cron.job;
-- Удалить:              select cron.unschedule('achievement-hourly-tick');

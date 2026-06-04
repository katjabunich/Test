// Раз в час будит бота: шлёт вечерний вопрос тем, у кого настал их час, и
// еженедельную сводку по воскресеньям. Дёргается pg_cron'ом с секретом.
// Самодостаточный файл; секреты — в achievements.config.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { db: { schema: 'achievements' }, auth: { persistSession: false } },
);

type Config = { telegram_bot_token: string; cron_secret: string };
let _cfg: Config | null = null;
async function config(): Promise<Config> {
  if (_cfg) return _cfg;
  const { data } = await db.from('config').select('telegram_bot_token, cron_secret').single();
  _cfg = data as Config;
  return _cfg;
}

async function send(chat: number, text: string) {
  const { telegram_bot_token } = await config();
  await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'Markdown' }),
  });
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function plural(n: number, one: string, few: string, many: string) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return few;
  return many;
}
const EVENING = [
  'Привет 🌙 Что хорошего случилось сегодня? Даже маленькое считается.',
  'Вечерний вопрос: чем ты можешь гордиться сегодня — пусть чуть-чуть? ✨',
  'Как прошёл день? Напиши одну вещь, которая получилась 💛',
  'Что сегодня было хорошего — и в чём тут есть твоя заслуга? 🌱',
  'Ловлю твой день: одно достижение, большое или крошечное?',
];

type User = {
  id: string; chat_id: number; reminder_hour: number; timezone: string;
  last_reminded_on: string | null; last_weekly_on: string | null;
};
type Entry = { body: string; agency_note: string | null; created_at: string };

Deno.serve(async (req) => {
  const cfg = await config();
  const url = new URL(req.url);
  const got = req.headers.get('x-cron-secret') ?? url.searchParams.get('secret');
  if (cfg.cron_secret && got !== cfg.cron_secret) return new Response('forbidden', { status: 403 });

  const { data } = await db.from('users').select('*').eq('reminder_enabled', true);
  const users = (data ?? []) as User[];
  for (const u of users) {
    try { await processUser(u); } catch (e) { console.error('cron user', u.id, e); }
  }
  return new Response(JSON.stringify({ processed: users.length }), {
    headers: { 'content-type': 'application/json' },
  });
});

function nowInTz(tz: string) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short',
  }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')), weekday: g('weekday') };
}

async function processUser(u: User) {
  const tz = u.timezone || 'Europe/Amsterdam';
  const { date, hour, weekday } = nowInTz(tz);

  // Воскресенье ~18:00 — недельная сводка (раз в день максимум).
  if (weekday === 'Sun' && hour === 18 && u.last_weekly_on !== date) {
    await weekly(u);
    await db.from('users').update({ last_weekly_on: date }).eq('id', u.id);
    return;
  }
  // Вечерний вопрос в выбранный час (раз в день максимум).
  if (hour === u.reminder_hour && u.last_reminded_on !== date) {
    await send(u.chat_id, pick(EVENING));
    await db.from('users').update({ last_reminded_on: date }).eq('id', u.id);
  }
}

async function weekly(u: User) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await db.from('entries').select('body, agency_note, created_at')
    .eq('user_id', u.id).gte('created_at', since).order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) {
    await send(u.chat_id, 'Неделя прошла без записей 🌙 Ничего страшного — давай начнём новую с одного хорошего момента? Просто напиши мне.');
    return;
  }
  const body = entries.map((e) => `• ${e.body}${e.agency_note ? ` — _${e.agency_note}_` : ''}`).join('\n');
  const head = `Воскресный итог 💛 За неделю ты собрала ${entries.length} ${plural(entries.length, 'достижение', 'достижения', 'достижений')}:\n`;
  await send(u.chat_id, head + '\n' + body + '\n\nГорда тобой. Хочешь разбор сильных сторон — /итоги');
}

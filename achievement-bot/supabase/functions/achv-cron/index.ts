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

async function send(chat: number, text: string, buttons?: { text: string; callback_data: string }[][]) {
  const { telegram_bot_token } = await config();
  await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat, text, parse_mode: 'Markdown',
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    }),
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
  'Что сегодня было хорошего? 🌱',
  'Ловлю твой день: одно достижение, большое или крошечное?',
];


// Группировка по дням: раньше всё валилось сплошным списком без дат.
const TZ = 'Europe/Amsterdam';
function dayLabel(iso: string) {
  const d = new Date(iso);
  const wd = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, weekday: 'short' }).format(d);
  const dm = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: 'numeric', month: 'long' }).format(d);
  return `${wd}, ${dm}`;
}
function dayKey(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}
function renderByDay(entries: { body: string; agency_note: string | null; created_at: string }[]) {
  const out: string[] = [];
  let cur = '';
  for (const e of entries) {
    const k = dayKey(e.created_at);
    if (k !== cur) { cur = k; out.push(`\n*${dayLabel(e.created_at)}*`); }
    out.push(`• ${e.body}${e.agency_note ? ` — _${e.agency_note}_` : ''}`);
  }
  return out.join('\n').trim();
}

const TAIL = [
  'Если сегодня было что-то хорошее — напиши, сохраню.',
  'Что сегодня? Пиши сколько есть, каждое с новой строки.',
  'Если есть что записать за сегодня — я тут.',
  'Захочешь добавить сегодняшнее — просто напиши.',
];
const HARD_DAY_BTN = [[{ text: 'Сегодня тяжёлый день', callback_data: 'hard_day' }]];

type Insight = { id: string; text: string };

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
  // 1-го числа в 12:00 — письмо за прошлый месяц (текст готовится заранее).
  if (date.slice(8) === '01' && hour === 12) await monthlyLetter(u, date);

  // Вечернее сообщение в выбранный час (раз в день максимум).
  if (hour === u.reminder_hour && u.last_reminded_on !== date) {
    await eveningNudge(u, date);
    await db.from('users').update({ last_reminded_on: date }).eq('id', u.id);
  }
}

// Вечером бот отдаёт наблюдение о ней. КАЖДОЕ — РОВНО ОДИН РАЗ: повторять уже
// прочитанное бессмысленно. Кончился запас — возвращаемся к простому вопросу,
// пока не подготовлена новая партия из свежих записей.
async function eveningNudge(u: User, today: string) {
  const { data } = await db.from('insights').select('id, text')
    .eq('user_id', u.id)
    .is('last_sent_on', null)
    .order('created_at', { ascending: true })
    .limit(1);
  const ins = (data ?? [])[0] as Insight | undefined;
  if (!ins) {
    await send(u.chat_id, pick(EVENING), HARD_DAY_BTN);
    return;
  }
  await db.from('insights').update({ last_sent_on: today }).eq('id', ins.id);
  await send(u.chat_id, `${ins.text}\n\n${pick(TAIL)}`, HARD_DAY_BTN);
}

async function monthlyLetter(u: User, today: string) {
  const [y, m] = today.split('-').map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const { data } = await db.from('letters').select('id, text')
    .eq('user_id', u.id).eq('period', prev).is('sent_on', null).limit(1);
  const l = (data ?? [])[0] as { id: string; text: string } | undefined;
  if (!l) return;
  await db.from('letters').update({ sent_on: today }).eq('id', l.id);
  await send(u.chat_id, l.text);
}

async function weekly(u: User) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await db.from('entries').select('body, agency_note, created_at')
    .eq('user_id', u.id).gte('created_at', since).order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) {
    await send(u.chat_id, 'Неделя прошла без записей 🌙 Напиши, когда будет что — я тут.');
    return;
  }
  const head = `Воскресный итог 💛 За неделю ты собрала ${entries.length} ${plural(entries.length, 'хорошую вещь', 'хорошие вещи', 'хороших вещей')}:\n`;
  await send(u.chat_id, head + renderByDay(entries) + '\n\nРазбор сильных сторон — /итоги');
}

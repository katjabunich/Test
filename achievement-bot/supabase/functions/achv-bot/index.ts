// Telegram webhook. Обслуживает ТОЛЬКО владельца. Самодостаточный файл
// (деплоится через Management API). Секреты и настройки — в таблице achievements.config.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// service_role + рабочая схема achievements. SUPABASE_* инъектятся автоматически.
const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { db: { schema: 'achievements' }, auth: { persistSession: false } },
);

type Config = {
  telegram_bot_token: string;
  owner_telegram_id: number;
  webhook_secret: string | null;
  anthropic_api_key: string | null;
  anthropic_model: string;
};
let _cfg: Config | null = null;
async function config(): Promise<Config> {
  if (_cfg) return _cfg;
  const { data } = await db.from('config').select('*').single();
  _cfg = data as Config;
  return _cfg;
}

// ── Telegram API ──────────────────────────────────────────────────────────────
async function tg(method: string, payload: Record<string, unknown>) {
  const { telegram_bot_token } = await config();
  const res = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error(`tg ${method}`, res.status, await res.text());
  return res;
}
const send = (chat: number, text: string, buttons?: { text: string; callback_data: string }[][]) =>
  tg('sendMessage', {
    chat_id: chat,
    text,
    parse_mode: 'Markdown',
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
async function sendDoc(chat: number, filename: string, content: string) {
  const { telegram_bot_token } = await config();
  const form = new FormData();
  form.append('chat_id', String(chat));
  form.append('document', new Blob([content], { type: 'text/plain' }), filename);
  await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendDocument`, {
    method: 'POST',
    body: form,
  });
}

// ── Тексты ────────────────────────────────────────────────────────────────────
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function plural(n: number, one: string, few: string, many: string) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return few;
  return many;
}
const SAVED = ['Записала ✨', 'Сохранила 🌱', 'Есть, записала 💛', 'Зафиксировала ✨', 'Поймала момент 📌'];
const WELCOME = `Привет 🤗

Я твой личный дневник достижений. Сюда ты записываешь хорошее, что случилось — *в том числе и благодаря тебе*. Даже маленькое. Даже то, что кажется «само получилось».

Как пользоваться — проще некуда:
• Просто *напиши мне* что произошло. Можно сразу несколько штук — каждое с новой строки.
• Каждый вечер я мягко спрошу сам, чтобы ты не забывала.
• Раз в неделю пришлю список — посмотреть, сколько всего ты сделала.

Команды (по желанию):
/week — что было за неделю
/итоги — разбор: какие у тебя повторяются сильные стороны
/export — выгрузить все записи
/time 21:00 — поменять время вечернего вопроса
/pause — пауза напоминаний  /resume — вернуть
/help — это меню

Попробуй прямо сейчас: напиши одно хорошее, что было сегодня ✨`;
const HELP = `Что я умею:

• Просто напиши мне — сохраню как достижение. Несколько штук — каждое с новой строки.
/week — список за последние 7 дней
/итоги — AI-разбор твоих сильных сторон и паттернов
/export — выгрузить всё текстом
/time 21:00 — время вечернего вопроса
/pause — пауза напоминаний  /resume — включить
/help — это меню`;
const PRIVATE_BOT = 'Это личный бот 🙅 Он работает только со своим владельцем.';
const AGENCY_SKIPPED = 'Ок, и так хорошо ✨';

// Вопрос «в чём твоя заслуга?» выключен: она и так пишет заслугу внутри текста
// («заставила себя», «настояла», «не поленилась»), а вопрос читался как навязчивый.
const AGENCY_CHANCE = 0;


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

// ── Типы строк БД ─────────────────────────────────────────────────────────────
type User = {
  id: string; telegram_id: number; chat_id: number; first_name: string | null;
  reminder_hour: number; awaiting_agency_for: string | null;
};
type Entry = { id: string; body: string; agency_note: string | null; created_at: string };

// ── HTTP entrypoint ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const cfg = await config();
  // Подпись: запрос реально от Телеграма.
  if (cfg.webhook_secret &&
      req.headers.get('x-telegram-bot-api-secret-token') !== cfg.webhook_secret) {
    return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try { update = await req.json(); } catch { return ok(); }

  const msg = update.message ?? update.edited_message;
  const cb = update.callback_query;
  const from = msg?.from ?? cb?.from;
  if (!from) return ok();

  // Бутстрап владельца: если в конфиге ещё нет владельца (0), первый написавший
  // закрепляется как хозяин. Бот новый и известен только ей — окно риска мизерное.
  if (!cfg.owner_telegram_id || Number(cfg.owner_telegram_id) === 0) {
    await db.from('config').update({ owner_telegram_id: from.id }).eq('id', true);
    cfg.owner_telegram_id = from.id;
    _cfg = null; // сбросить кеш, чтобы следующий запрос перечитал свежий конфиг
  } else if (Number(from.id) !== Number(cfg.owner_telegram_id)) {
    // Белый список из одного человека.
    const chat = msg?.chat?.id ?? cb?.message?.chat?.id;
    if (chat) await send(chat, PRIVATE_BOT);
    return ok();
  }

  const chat = msg?.chat?.id ?? cb?.message?.chat?.id;
  const user = await ensureUser(from, chat);
  try {
    if (cb) await onCallback(user, cb);
    else if (msg?.text) await onText(user, msg.text.trim());
  } catch (e) { console.error('handler', e); }
  return ok();
});

const ok = () => new Response('ok');

async function ensureUser(from: any, chat: number): Promise<User> {
  const { data } = await db.from('users').select('*').eq('telegram_id', from.id).maybeSingle();
  if (data) return data as User;
  const { data: created } = await db.from('users')
    .insert({ telegram_id: from.id, chat_id: chat, first_name: from.first_name ?? null, is_owner: true })
    .select('*').single();
  return created as User;
}

async function onText(user: User, text: string) {
  if (text.startsWith('/')) {
    const [cmd, ...rest] = text.split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd.toLowerCase()) {
      case '/start':  return void send(user.chat_id, WELCOME);
      case '/help':   return void send(user.chat_id, HELP);
      case '/week':   return void weekSummary(user);
      case '/итоги':
      case '/insights': return void insights(user);
      case '/export': return void exportAll(user);
      case '/time':   return void setTime(user, arg);
      case '/pause':
        await db.from('users').update({ reminder_enabled: false }).eq('id', user.id);
        return void send(user.chat_id, 'Поставила напоминания на паузу. Включить — /resume 🌙');
      case '/resume':
        await db.from('users').update({ reminder_enabled: true }).eq('id', user.id);
        return void send(user.chat_id, 'Готово, снова буду напоминать по вечерам ✨');
      case '/skip':
        if (user.awaiting_agency_for) {
          await db.from('users').update({ awaiting_agency_for: null }).eq('id', user.id);
          return void send(user.chat_id, AGENCY_SKIPPED);
        }
        return;
      default: return void send(user.chat_id, HELP);
    }
  }

  // Одно сообщение почти всегда содержит НЕСКОЛЬКО достижений — по одному в строке.
  // Раньше всё это падало одной записью и в сводке слипалось в один пункт-кашу.
  const parts = text
    .split('\n')
    .map((s) => s.replace(/^\s*[-•*—]\s*/, '').trim())
    .filter(Boolean);
  if (!parts.length) return;

  // created_at со сдвигом в миллисекунду — чтобы порядок внутри сообщения сохранился.
  const base = Date.now();
  const rows = parts.map((body, i) => ({
    user_id: user.id,
    body,
    source: 'manual',
    created_at: new Date(base + i).toISOString(),
  }));
  await db.from('entries').insert(rows);

  const n = parts.length;
  await send(
    user.chat_id,
    n > 1 ? `${pick(SAVED)} — ${n} ${plural(n, 'запись', 'записи', 'записей')}` : pick(SAVED),
  );
}

async function onCallback(user: User, cb: any) {
  const data: string = cb.data ?? '';
  await tg('answerCallbackQuery', { callback_query_id: cb.id });
  if (data === 'skip') {
    await send(user.chat_id, AGENCY_SKIPPED);
  }
}

async function weekSummary(user: User) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await db.from('entries').select('*')
    .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length)
    return void send(user.chat_id, 'За последнюю неделю записей пока нет. Это не «ничего не было» — просто ещё не пойманное. Напиши хоть одно 💛');
  const head = `Вот что ты сделала за неделю — ${entries.length} ${plural(entries.length, 'хорошая вещь', 'хорошие вещи', 'хороших вещей')} 💛\n`;
  await send(user.chat_id, head + renderByDay(entries));
}

async function exportAll(user: User) {
  const { data } = await db.from('entries').select('*')
    .eq('user_id', user.id).order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) return void send(user.chat_id, 'Записей пока нет — как появятся, выгружу.');
  const text = entries.map((e) => {
    const d = e.created_at.slice(0, 10);
    return `[${d}] ${e.body}${e.agency_note ? `\n  заслуга: ${e.agency_note}` : ''}`;
  }).join('\n\n');
  await sendDoc(user.chat_id, 'мои-достижения.txt', text);
}

async function insights(user: User) {
  const cfg = await config();
  if (!cfg.anthropic_api_key)
    return void send(user.chat_id,
      'AI-разбор пока не подключён (нужен ключ Claude API). Запись и сводки работают и без него. А пока можешь сделать /export и закинуть текст в обычный Claude по подписке.');
  const since = new Date(Date.now() - 31 * 864e5).toISOString();
  const { data } = await db.from('entries').select('*')
    .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (entries.length < 3)
    return void send(user.chat_id, 'Пока маловато записей для разбора — добавь ещё несколько, и я найду в них паттерны ✨');
  await send(user.chat_id, 'Читаю твои записи и ищу закономерности… 🔎');
  try {
    await send(user.chat_id, await analyze(cfg, entries));
  } catch {
    await send(user.chat_id, 'Не получилось сделать разбор сейчас, попробуй позже 🙏');
  }
}

function setTime(user: User, arg: string) {
  const m = arg.match(/^(\d{1,2})(?::(\d{2}))?$/);
  const h = m ? Number(m[1]) : NaN;
  if (!m || h < 0 || h > 23) return send(user.chat_id, 'Не разобрала время. Формат: /time 21:00');
  return db.from('users').update({ reminder_hour: h }).eq('id', user.id)
    .then(() => send(user.chat_id, `Хорошо, буду спрашивать в ${String(h).padStart(2, '0')}:00 🌙`));
}

// ── AI-разбор ─────────────────────────────────────────────────────────────────
const AI_SYSTEM = `Ты — тёплый, проницательный наблюдатель. Тебе дают дневник достижений человека, который склонен себя обесценивать и считать свои успехи случайностью.

Твоя задача — НЕ пересказывать записи, а отразить человеку закономерности, которые он сам не замечает:
— какие сильные стороны / качества повторяются из записи в запись (называй их прямо: смелость, доведение до конца, забота, инициатива…);
— где видно, что результат случился именно БЛАГОДАРЯ его действиям, а не «повезло»;
— 2–4 конкретных наблюдения, каждое со ссылкой на примеры из записей.

Тон: тёплый, конкретный, без сюсюканья и без пафоса. Обращайся на «ты». Пиши по-русски.
Не выдумывай того, чего нет в записях. В конце — одна короткая фраза-итог, которую человеку приятно и честно про себя услышать.
Ответ — обычный текст для мессенджера (без markdown-заголовков), 150–250 слов.`;

async function analyze(cfg: Config, entries: Entry[]): Promise<string> {
  const lines = entries.map((e) => {
    const d = e.created_at.slice(0, 10);
    return `- [${d}] ${e.body}${e.agency_note ? ` (моя заслуга: ${e.agency_note})` : ''}`;
  }).join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.anthropic_api_key!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.anthropic_model,
      max_tokens: 700,
      system: AI_SYSTEM,
      messages: [{ role: 'user', content: `Записи за последний месяц:\n\n${lines}` }],
    }),
  });
  if (!res.ok) { console.error('anthropic', res.status, await res.text()); throw new Error('ai'); }
  const out = await res.json();
  return out.content?.[0]?.text?.trim() || 'Не нашла, что сказать — попробуй позже.';
}

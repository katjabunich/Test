// Telegram webhook handler. Принимает апдейты, обслуживает ТОЛЬКО владельца.
import { db, type BotUser, type Entry } from '../_shared/db.ts';
import { sendMessage, sendDocument, answerCallback } from '../_shared/telegram.ts';
import { analyze, aiEnabled } from '../_shared/ai.ts';
import * as M from '../_shared/messages.ts';

const OWNER_ID = Number(Deno.env.get('OWNER_TELEGRAM_ID'));
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');

// Шанс показать уточнение «в чём заслуга» после записи (не каждый раз — чтобы не бесило).
const AGENCY_CHANCE = 0.34;

Deno.serve(async (req) => {
  // 1) Проверяем подпись: запрос реально от Телеграма, а не от случайного человека.
  if (
    WEBHOOK_SECRET &&
    req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET
  ) {
    return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return ok();
  }

  const msg = update.message ?? update.edited_message;
  const cb = update.callback_query;
  const from = msg?.from ?? cb?.from;
  if (!from) return ok();

  // 2) Белый список из одного человека — владельца.
  if (Number(from.id) !== OWNER_ID) {
    const chatId = msg?.chat?.id ?? cb?.message?.chat?.id;
    if (chatId) await sendMessage(chatId, M.PRIVATE_BOT);
    return ok();
  }

  const chatId = msg?.chat?.id ?? cb?.message?.chat?.id;
  const user = await ensureUser(from, chatId);

  try {
    if (cb) await handleCallback(user, cb);
    else if (msg?.text) await handleText(user, msg.text.trim());
  } catch (e) {
    console.error('handler error', e);
  }
  return ok();
});

const ok = () => new Response('ok');

// ── Пользователь ───────────────────────────────────────────────────────────
async function ensureUser(from: any, chatId: number): Promise<BotUser> {
  const { data } = await db.from('bot_users').select('*').eq('telegram_id', from.id).maybeSingle();
  if (data) return data as BotUser;
  const { data: created } = await db
    .from('bot_users')
    .insert({
      telegram_id: from.id,
      chat_id: chatId,
      first_name: from.first_name ?? null,
      is_owner: true,
    })
    .select('*')
    .single();
  return created as BotUser;
}

// ── Текстовые сообщения ──────────────────────────────────────────────────────
async function handleText(user: BotUser, text: string) {
  // Команды
  if (text.startsWith('/')) {
    const [cmd, ...rest] = text.split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd.toLowerCase()) {
      case '/start':
        return void sendMessage(user.chat_id, M.WELCOME);
      case '/help':
        return void sendMessage(user.chat_id, M.HELP);
      case '/week':
        return void weekSummary(user);
      case '/итоги':
      case '/insights':
        return void insights(user);
      case '/export':
        return void exportAll(user);
      case '/time':
        return void setTime(user, arg);
      case '/pause':
        await db.from('bot_users').update({ reminder_enabled: false }).eq('id', user.id);
        return void sendMessage(user.chat_id, M.PAUSED);
      case '/resume':
        await db.from('bot_users').update({ reminder_enabled: true }).eq('id', user.id);
        return void sendMessage(user.chat_id, M.RESUMED);
      case '/skip':
        if (user.awaiting_agency_for) {
          await db.from('bot_users').update({ awaiting_agency_for: null }).eq('id', user.id);
          return void sendMessage(user.chat_id, M.AGENCY_SKIPPED);
        }
        return;
      default:
        return void sendMessage(user.chat_id, M.HELP);
    }
  }

  // Ждём приписку «в чём заслуга» к предыдущей записи?
  if (user.awaiting_agency_for) {
    await db.from('entries').update({ agency_note: text }).eq('id', user.awaiting_agency_for);
    await db.from('bot_users').update({ awaiting_agency_for: null }).eq('id', user.id);
    return void sendMessage(user.chat_id, M.AGENCY_SAVED);
  }

  // Обычная запись.
  const { data: entry } = await db
    .from('entries')
    .insert({ user_id: user.id, body: text, source: 'manual' })
    .select('id')
    .single();

  // Иногда мягко предлагаем дописать про свою роль.
  if (Math.random() < AGENCY_CHANCE && entry) {
    await sendMessage(user.chat_id, `${M.pick(M.SAVED)}\n\n${M.AGENCY_PROMPT}`, [
      [
        { text: M.AGENCY_BTN, callback_data: `agency:${entry.id}` },
        { text: M.AGENCY_SKIP_BTN, callback_data: 'skip' },
      ],
    ]);
  } else {
    await sendMessage(user.chat_id, M.pick(M.SAVED));
  }
}

// ── Инлайн-кнопки ─────────────────────────────────────────────────────────────
async function handleCallback(user: BotUser, cb: any) {
  const data: string = cb.data ?? '';
  await answerCallback(cb.id);
  if (data.startsWith('agency:')) {
    const entryId = data.slice('agency:'.length);
    await db.from('bot_users').update({ awaiting_agency_for: entryId }).eq('id', user.id);
    await sendMessage(user.chat_id, M.AGENCY_WAIT);
  } else if (data === 'skip') {
    await sendMessage(user.chat_id, M.AGENCY_SKIPPED);
  }
}

// ── Сводки / экспорт / разбор ─────────────────────────────────────────────────
async function weekSummary(user: BotUser) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await db
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) return void sendMessage(user.chat_id, M.EMPTY_WEEK);
  const body = entries.map((e) => `• ${e.body}${e.agency_note ? ` — _${e.agency_note}_` : ''}`).join('\n');
  await sendMessage(user.chat_id, M.weekHeader(entries.length) + '\n' + body);
}

async function exportAll(user: BotUser) {
  const { data } = await db
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) return void sendMessage(user.chat_id, M.EMPTY_EXPORT);
  const text = entries
    .map((e) => {
      const d = new Date(e.created_at).toISOString().slice(0, 10);
      const note = e.agency_note ? `\n  заслуга: ${e.agency_note}` : '';
      return `[${d}] ${e.body}${note}`;
    })
    .join('\n\n');
  await sendDocument(user.chat_id, 'мои-достижения.txt', text);
}

async function insights(user: BotUser) {
  if (!aiEnabled()) return void sendMessage(user.chat_id, M.NO_AI_KEY);
  const since = new Date(Date.now() - 31 * 864e5).toISOString();
  const { data } = await db
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (entries.length < 3) return void sendMessage(user.chat_id, M.AI_TOO_FEW);
  await sendMessage(user.chat_id, M.AI_THINKING);
  try {
    const out = await analyze(entries, 'последний месяц');
    await sendMessage(user.chat_id, out);
  } catch {
    await sendMessage(user.chat_id, 'Не получилось сделать разбор сейчас, попробуй позже 🙏');
  }
}

function setTime(user: BotUser, arg: string) {
  const m = arg.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return sendMessage(user.chat_id, M.TIME_BAD);
  const h = Number(m[1]);
  if (h < 0 || h > 23) return sendMessage(user.chat_id, M.TIME_BAD);
  return db
    .from('bot_users')
    .update({ reminder_hour: h })
    .eq('id', user.id)
    .then(() => sendMessage(user.chat_id, M.TIME_SET(h)));
}

// Планировщик. Вызывается pg_cron каждый час. Делает две вещи:
//   1) вечернее напоминание-вопрос (в локальный час пользователя, один раз в день);
//   2) недельную сводку по воскресеньям вечером.
import { db, type BotUser, type Entry } from '../_shared/db.ts';
import { sendMessage } from '../_shared/telegram.ts';
import * as M from '../_shared/messages.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET');

Deno.serve(async (req) => {
  // Защита: дёргать может только pg_cron с секретом.
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  const { data } = await db.from('bot_users').select('*').eq('reminder_enabled', true);
  const users = (data ?? []) as BotUser[];

  for (const u of users) {
    const { hour, date, weekday } = localParts(u.timezone);

    // Вечерний вопрос — раз в день, в выбранный час.
    if (hour === u.reminder_hour && u.last_reminded_on !== date) {
      await sendMessage(u.chat_id, M.pick(M.EVENING_PROMPTS));
      await db.from('bot_users').update({ last_reminded_on: date }).eq('id', u.id);
    }

    // Недельная сводка — воскресенье вечером, один раз в неделю.
    if (weekday === 0 && hour === u.reminder_hour && u.last_weekly_on !== date) {
      await sendWeekly(u);
      await db.from('bot_users').update({ last_weekly_on: date }).eq('id', u.id);
    }
  }

  return new Response('ok');
});

function localParts(tz: string): { hour: number; date: string; weekday: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour === '24' ? '0' : parts.hour);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hour, date, weekday: map[parts.weekday] ?? -1 };
}

async function sendWeekly(u: BotUser) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await db
    .from('entries')
    .select('*')
    .eq('user_id', u.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  const entries = (data ?? []) as Entry[];
  if (!entries.length) return;
  const body = entries
    .map((e) => `• ${e.body}${e.agency_note ? ` — _${e.agency_note}_` : ''}`)
    .join('\n');
  await sendMessage(u.chat_id, M.weekHeader(entries.length) + '\n' + body);
}

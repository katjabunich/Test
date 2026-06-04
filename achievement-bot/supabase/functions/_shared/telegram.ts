// Тонкая обёртка над Telegram Bot API.

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const API = `https://api.telegram.org/bot${TOKEN}`;

type InlineButton = { text: string; callback_data: string };

export async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`tg ${method} failed`, res.status, await res.text());
  }
  return res;
}

export function sendMessage(
  chatId: number,
  text: string,
  buttons?: InlineButton[][],
) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}

export function answerCallback(id: string, text?: string) {
  return tg('answerCallbackQuery', { callback_query_id: id, ...(text ? { text } : {}) });
}

// Отправка длинного текста файлом (для /export).
export async function sendDocument(chatId: number, filename: string, content: string) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append(
    'document',
    new Blob([content], { type: 'text/plain' }),
    filename,
  );
  const res = await fetch(`${API}/sendDocument`, { method: 'POST', body: form });
  if (!res.ok) console.error('sendDocument failed', res.status, await res.text());
  return res;
}

// AI-разбор записей через Claude API. Опционально: если ключа нет — фича выключена.
// Стоит копейки (модель Haiku); стартовых $5 на аккаунте хватает на годы.
import type { Entry } from './db.ts';

const KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001';

export const aiEnabled = () => !!KEY;

const SYSTEM = `Ты — тёплый, проницательный наблюдатель. Тебе дают дневник достижений человека, который склонен себя обесценивать и считать свои успехи случайностью.

Твоя задача — НЕ пересказывать записи, а отразить человеку закономерности, которые он сам не замечает:
— какие сильные стороны / качества повторяются из записи в запись (называй их прямо: смелость, доведение до конца, забота, инициатива…);
— где видно, что результат случился именно БЛАГОДАРЯ его действиям, а не «повезло»;
— 2–4 конкретных наблюдения, каждое со ссылкой на примеры из записей.

Тон: тёплый, конкретный, без сюсюканья и без пафоса. Обращайся на «ты». Пиши по-русски.
Не выдумывай того, чего нет в записях. В конце — одна короткая фраза-итог, которую человеку приятно и честно про себя услышать.
Ответ — обычный текст для мессенджера (без markdown-заголовков), 150–250 слов.`;

export async function analyze(entries: Entry[], periodLabel: string): Promise<string> {
  const lines = entries
    .map((e) => {
      const d = new Date(e.created_at).toISOString().slice(0, 10);
      const note = e.agency_note ? ` (моя заслуга: ${e.agency_note})` : '';
      return `- [${d}] ${e.body}${note}`;
    })
    .join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Записи за ${periodLabel}:\n\n${lines}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('anthropic failed', res.status, await res.text());
    throw new Error('ai_failed');
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? '';
}

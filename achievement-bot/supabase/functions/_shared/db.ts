// Supabase-клиент под service_role — ходит в базу в обход RLS.
// Ключ живёт только на сервере (в секретах функции), наружу не попадает.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

export type BotUser = {
  id: string;
  telegram_id: number;
  chat_id: number;
  first_name: string | null;
  is_owner: boolean;
  reminder_enabled: boolean;
  reminder_hour: number;
  timezone: string;
  awaiting_agency_for: string | null;
  last_reminded_on: string | null;
  last_weekly_on: string | null;
};

export type Entry = {
  id: string;
  user_id: string;
  body: string;
  agency_note: string | null;
  source: string;
  created_at: string;
};

/* Translations for DoIt. Add a key here in both `ru` and `en`, then use
   it via `useT()` in client components or `getT()` in server components.
   When a key is missing in the active language, falls back to ru.

   Structure: nested by surface area. Inside each area, every key has the
   same { ru, en } shape so look-ups are uniform. */

export type Lang = "ru" | "en";
export const LANGS: Lang[] = ["ru", "en"];
export const DEFAULT_LANG: Lang = "ru";

type S = { ru: string; en: string };

export const DICT = {
  common: {
    back:    { ru: "Назад",        en: "Back" },
    next:    { ru: "Дальше",       en: "Next" },
    save:    { ru: "Сохранить",    en: "Save" },
    cancel:  { ru: "Отмена",       en: "Cancel" },
    delete:  { ru: "Удалить",      en: "Delete" },
    skip:    { ru: "Пропустить",   en: "Skip" },
    done:    { ru: "Готово",       en: "Done" },
    add:     { ru: "Добавить",     en: "Add" },
    waiting: { ru: "Минутку…",     en: "Just a sec…" },
    today:   { ru: "Сегодня",      en: "Today" },
    yesterday: { ru: "вчера",      en: "yesterday" },
    tomorrow:  { ru: "завтра",     en: "tomorrow" },
    err_title: { ru: "Что-то пошло не так", en: "Something went wrong" },
    err_unknown:{ ru: "Неизвестная ошибка",  en: "Unknown error" },
    retry:     { ru: "Повторить",  en: "Retry" },
  },

  /* ──────────── Onboarding ──────────── */
  onb: {
    chip:        { ru: "{n} / {total}",     en: "{n} / {total}" },
    skip:        { ru: "Пропустить",        en: "Skip" },
    back:        { ru: "Назад",             en: "Back" },

    s1_title:    { ru: "Утро без хаоса",    en: "Calm mornings" },
    s1_pre:      { ru: "На ",               en: "Everything you need to do today, " },
    s1_mark:     { ru: "одном экране",      en: "on one screen" },
    s1_post:     { ru: " всё, что нужно сделать сегодня.", en: "." },
    s1_cta:      { ru: "Дальше",            en: "Next" },

    s2_title:    { ru: "Сферы жизни",       en: "Spheres of life" },
    s2_pre:      { ru: "Работа, дом, отдых — у каждой ", en: "Work, home, rest — each one gets " },
    s2_mark:     { ru: "свой цвет",         en: "its own colour" },
    s2_post:     { ru: ".",                 en: "." },
    s2_cta:      { ru: "Дальше",            en: "Next" },

    s3_title:    { ru: "День за днём",      en: "Day by day" },
    s3_pre:      { ru: "Бегать утром, читать вечером — повторяй каждый день, и ", en: "Run in the morning, read in the evening — repeat each day, and " },
    s3_mark:     { ru: "привычка приживётся", en: "the habit takes root" },
    s3_post:     { ru: ".",                 en: "." },
    s3_cta:      { ru: "Готова, поехали",   en: "I'm ready, let's go" },
  },

  /* ──────────── Login ──────────── */
  login: {
    signin_title:    { ru: "С возвращением",       en: "Welcome back" },
    signup_title:    { ru: "Заведи аккаунт",       en: "Create your account" },

    signin_sub_pre:  { ru: "Задачи и привычки на ",       en: "Tasks and habits on " },
    signin_sub_mark: { ru: "всех твоих устройствах",      en: "every device you use" },
    signin_sub_post: { ru: ".",                            en: "." },

    signup_sub_pre:  { ru: "Сферы, задачи, привычки — ",   en: "Spheres, tasks, habits — " },
    signup_sub_mark: { ru: "синхронизация",                en: "cloud-synced" },
    signup_sub_post: { ru: " в облаке.",                   en: "everywhere." },

    tab_signin:    { ru: "Войти",         en: "Sign in" },
    tab_signup:    { ru: "Регистрация",   en: "Sign up" },

    email:         { ru: "Email",                         en: "Email" },
    password:      { ru: "Пароль",                        en: "Password" },
    pw_hint:       { ru: "От 8 символов",                 en: "8 characters or more" },
    invite:        { ru: "Код приглашения",               en: "Invite code" },
    invite_hint:   { ru: "Спроси у Кати",                 en: "Ask Katja" },

    cta_signin:    { ru: "Войти",                         en: "Sign in" },
    cta_signup:    { ru: "Зарегистрироваться",            en: "Sign up" },

    err_required:  { ru: "Введи email и пароль.",         en: "Enter email and password." },
    err_pw_short:  { ru: "Пароль должен быть от 8 символов.", en: "Password must be 8+ characters." },
    err_pw_match:  { ru: "Пароли не совпадают.",          en: "Passwords don't match." },
    err_pw_same:   { ru: "Новый пароль должен отличаться от старого.", en: "New password must differ from the old one." },
    err_invalid:   { ru: "Неверный email или пароль.",    en: "Wrong email or password." },
    err_exists:    { ru: "Такой аккаунт уже существует — войди.", en: "An account already exists — sign in instead." },
    err_rate:      { ru: "Слишком много попыток. Подожди минуту.", en: "Too many attempts. Wait a minute." },
    err_confirm_email: { ru: "Подтверди email — мы отправили письмо со ссылкой. После подтверждения вернись и войди.", en: "Check your inbox — we sent a confirmation link. Come back to sign in once it's confirmed." },
    err_bad_invite:{ ru: "Неверный код приглашения.",     en: "Invalid invite code." },
    err_invite_no_env:{ ru: "Переменная INVITE_CODES не задана в окружении Vercel (Production). Добавь её и сделай Redeploy.", en: "INVITE_CODES env var is not set on Vercel (Production). Add it and redeploy." },
    footer:        { ru: "v2 · вход и облачная синхронизация", en: "v2 · auth and cloud sync" },
  },

  /* ──────────── Today ──────────── */
  today: {
    morning:   { ru: "Доброе утро",        en: "Good morning" },
    afternoon: { ru: "Добрый день",        en: "Good afternoon" },
    evening:   { ru: "Добрый вечер",       en: "Good evening" },
    night:     { ru: "Доброй ночи",        en: "Good night" },
    name_ph:   { ru: "представься",        en: "your name" },

    next_task:    { ru: "Следующая задача", en: "Next task" },
    do_it:        { ru: "Сделать",          en: "Do it" },
    h_today:    { ru: "Сегодня",            en: "Today" },
    h_overdue:  { ru: "Просрочено",         en: "Overdue" },
    h_week:     { ru: "На этой неделе",     en: "This week" },
    h_next:     { ru: "Дальше",             en: "Next up" },
    h_week_short:{ ru: "На неделе",         en: "This week" },
    overdue_count:{ ru: "просрочено",       en: "overdue" },
    empty_fresh: { ru: "Чисто. Добавь первое дело — кнопкой плюса внизу.", en: "Clean slate. Tap the + button below to add your first task." },
    empty_done_pre:{ ru: "Свободно на сегодня. На неделе ещё ",  en: "All clear today. " },
    empty_done_post:{ ru: " — посмотри.",                        en: " more this week — take a look." },
  },

  /* ──────────── Tasks ──────────── */
  tasks: {
    title:     { ru: "Задачи",          en: "Tasks" },
    sub:       { ru: "По срокам и сферам", en: "By date and sphere" },
    h_overdue: { ru: "Просрочено",      en: "Overdue" },
    h_today:   { ru: "Сегодня",         en: "Today" },
    h_week:    { ru: "На неделе",       en: "This week" },
    h_later:   { ru: "Позже",           en: "Later" },
    h_nodate:  { ru: "Без даты",        en: "No date" },
    filter_all:  { ru: "Все",           en: "All" },
    empty:       { ru: "Пока нет задач", en: "No tasks yet" },
    empty_hint:  { ru: "Тапни +, чтобы добавить первую.", en: "Tap + to add the first one." },
    empty_filter:{ ru: "В этой сфере пусто", en: "Nothing in this sphere yet" },
  },

  /* ──────────── Habits ──────────── */
  habits: {
    title:        { ru: "Привычки",         en: "Habits" },
    sub:          { ru: "День за днём",     en: "Day by day" },
    best_streak:  { ru: "Лучший страйк",    en: "Best streak" },
    days:         { ru: "дней",             en: "days" },
    add:          { ru: "+ Добавить привычку", en: "+ Add a habit" },
    empty_title:  { ru: "Создай первую привычку", en: "Add your first habit" },
    empty_body:   { ru: "Что хочешь делать день за днём?", en: "What do you want to do day after day?" },

    sched_daily:  { ru: "Каждый день",       en: "Every day" },
    sched_weekdays:{ ru: "По будням",         en: "Weekdays" },
    sched_n_per_week:{ ru: "{n} раз в неделю", en: "{n} times a week" },
    week_progress:{ ru: "на неделе",          en: "this week" },
  },

  /* ──────────── Stats ──────────── */
  stats: {
    title:           { ru: "Статистика",          en: "Statistics" },
    sub:             { ru: "Зеркало продуктивности", en: "Mirror of your output" },
    tab_today:       { ru: "Сегодня",             en: "Today" },
    tab_week:        { ru: "Неделя",              en: "Week" },
    tab_month:       { ru: "Месяц",               en: "Month" },
    completed_count: { ru: "задач выполнено",     en: "tasks completed" },
    completed_one:   { ru: "задача выполнена",    en: "task completed" },
    completed_few:   { ru: "задачи выполнены",    en: "tasks completed" },
    section_done:    { ru: "Что сделано",         en: "What got done" },
    section_breakdown:{ ru: "По сферам",          en: "By sphere" },
    no_sphere:       { ru: "Без сферы",           en: "No sphere" },
    yesterday:       { ru: "Вчера",               en: "Yesterday" },
    more_count:      { ru: "+ ещё {n}",           en: "+{n} more" },
    empty_pre:       { ru: "За этот период ничего не завершено. ", en: "Nothing wrapped up in this window. " },
    empty_mark:      { ru: "Иногда нужен отдых",  en: "Rest counts too" },
    empty_post:      { ru: ".",                   en: "." },
  },

  /* ──────────── Settings ──────────── */
  settings: {
    title:       { ru: "Настройки",      en: "Settings" },
    sub:         { ru: "Сферы и аккаунт", en: "Spheres and account" },

    h_spheres:   { ru: "Сферы жизни",    en: "Spheres of life" },
    add_sphere:  { ru: "+ Добавить сферу", en: "+ Add a sphere" },
    no_spheres:  { ru: "Пока пусто. Создай первую сферу.", en: "Empty for now. Create your first sphere." },

    h_account:   { ru: "Аккаунт",        en: "Account" },
    change_pw:   { ru: "Сменить пароль", en: "Change password" },
    sign_out:    { ru: "Выйти",          en: "Sign out" },

    h_app:       { ru: "Приложение",     en: "App" },
    sound:       { ru: "Звуки",          en: "Sound" },
    haptic:      { ru: "Вибрация",       en: "Haptic" },
    notify:      { ru: "Уведомления",    en: "Notifications" },
    language:    { ru: "Язык",           en: "Language" },

    digest:           { ru: "Утренний дайджест",   en: "Morning digest" },
    digest_clear:     { ru: "Выключить дайджест",   en: "Clear digest" },
    push_test:        { ru: "Прислать тестовое",   en: "Send a test notification" },
    push_test_sent:   { ru: "Отправлено. Должно прийти через секунду.", en: "Sent. Should arrive in a second." },
    push_test_failed: { ru: "Не удалось отправить. Проверь, разрешены ли уведомления.", en: "Couldn't send. Check that notifications are allowed." },
    push_err_unsupported: { ru: "Этот браузер не умеет push-уведомления.", en: "This browser doesn't support push notifications." },
    push_err_no_notification_api: { ru: "Уведомления недоступны (нужен iOS 16.4+ и установка на экран Домой).", en: "Notifications API not available (needs iOS 16.4+ and add-to-home-screen)." },
    push_err_denied:      { ru: "Разрешение не выдано — открой настройки браузера и разреши уведомления для DoIt.", en: "Permission denied — go to browser settings and allow notifications for DoIt." },
    push_err_no_vapid:    { ru: "Сервер не настроен (VAPID-ключ).", en: "Server isn't configured (VAPID key missing)." },
    push_err_server:      { ru: "Сервер не сохранил подписку.", en: "The server failed to store the subscription." },
    push_err_unknown:     { ru: "Что-то пошло не так. Попробуй ещё раз.", en: "Something went wrong. Try again." },
  },

  /* ──────────── Password modal ──────────── */
  pw: {
    title:        { ru: "Сменить пароль",       en: "Change password" },
    new_label:    { ru: "Новый пароль",         en: "New password" },
    confirm_label:{ ru: "Повтори новый пароль", en: "Repeat new password" },
    pw_hint:      { ru: "От 8 символов",        en: "8 characters or more" },
    success:      { ru: "Пароль обновлён ✓",    en: "Password updated ✓" },
  },

  /* ──────────── Sphere modal ──────────── */
  sphere: {
    title_new:    { ru: "Новая сфера",       en: "New sphere" },
    title_edit:   { ru: "Сфера",             en: "Sphere" },
    name_ph:      { ru: "Название",          en: "Name" },
    color_label:  { ru: "Цвет",              en: "Colour" },
    delete_confirm: { ru: "Удалить сферу? Задачи в ней останутся, но без сферы.", en: "Delete sphere? Tasks in it will stay but lose the sphere." },
  },

  /* ──────────── Habit modal ──────────── */
  habit: {
    title_new:    { ru: "Новая привычка",    en: "New habit" },
    title_edit:   { ru: "Привычка",          en: "Habit" },
    name_ph:      { ru: "Название",          en: "Name" },
    icon_label:   { ru: "Иконка",            en: "Icon" },
    color_label:  { ru: "Цвет",              en: "Colour" },
    schedule_label:{ ru: "Когда",            en: "When" },
    sched_daily:  { ru: "Каждый день",       en: "Every day" },
    sched_weekdays:{ ru: "По будням",         en: "Weekdays" },
    sched_n:      { ru: "{n} раз в неделю",  en: "{n} times a week" },
    delete_confirm: { ru: "Удалить привычку и всю историю?", en: "Delete this habit and all its history?" },
    or_emoji:     { ru: "или эмодзи:",         en: "or emoji:" },
  },

  /* ──────────── Task modal ──────────── */
  task: {
    title_new:     { ru: "Новая задача",     en: "New task" },
    title_edit:    { ru: "Задача",           en: "Task" },
    name_ph:       { ru: "Что нужно сделать?", en: "What needs doing?" },
    sphere_label:  { ru: "Сфера",            en: "Sphere" },
    sphere_none:   { ru: "Без сферы",        en: "No sphere" },
    date_label:    { ru: "Срок",             en: "Date" },
    date_none:     { ru: "Без даты",         en: "No date" },
    do_today:      { ru: "Сделать сегодня",  en: "Do today" },
    note_label:    { ru: "Заметка",          en: "Note" },
    note_ph:       { ru: "Подробности",      en: "Details" },
    remind_label:  { ru: "Напомнить",        en: "Remind me" },
    remind_clear:  { ru: "Убрать напоминание", en: "Clear reminder" },
    repeat_label:  { ru: "Повтор",           en: "Repeat" },
    repeat_none:   { ru: "Однократно",       en: "Never" },
    repeat_daily:  { ru: "Каждый день",      en: "Daily" },
    repeat_weekly: { ru: "Каждую неделю",    en: "Weekly" },
    repeat_biweekly:{ ru: "Раз в 2 недели",  en: "Every 2 weeks" },
    repeat_monthly:{ ru: "Каждый месяц",     en: "Monthly" },
    delete_confirm: { ru: "Удалить задачу?", en: "Delete this task?" },
    save_failed:    { ru: "Не удалось сохранить. Попробуй ещё раз.", en: "Couldn't save. Try again." },
  },

  /* ──────────── Date helpers ──────────── */
  date: {
    months: {
      ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"] as const,
      en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const,
    },
    weekdays_short: {
      ru: ["вс","пн","вт","ср","чт","пт","сб"] as const,
      en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const,
    },
  },
} as const;

/** Resolve a translation by 2-segment key path, e.g. t("login.email"). */
type Leaf = S;
type AnyDict = Record<string, Record<string, unknown>>;

function lookup(area: string, key: string): Leaf | undefined {
  const a = (DICT as unknown as AnyDict)[area];
  if (!a) return undefined;
  const v = a[key];
  if (v && typeof v === "object" && "ru" in v && "en" in v) return v as Leaf;
  return undefined;
}

export function tFor(lang: Lang) {
  return (path: string, vars?: Record<string, string | number>): string => {
    const [area, key] = path.split(".");
    if (!area || !key) return path;
    const leaf = lookup(area, key);
    if (!leaf) return path;
    let v = leaf[lang] || leaf.ru;
    if (vars) {
      for (const [k, val] of Object.entries(vars)) {
        v = v.replace(`{${k}}`, String(val));
      }
    }
    return v;
  };
}

/** Direct array accessor for things like months/weekdays where index matters. */
export function months(lang: Lang): readonly string[] {
  return DICT.date.months[lang] ?? DICT.date.months.ru;
}
export function weekdaysShort(lang: Lang): readonly string[] {
  return DICT.date.weekdays_short[lang] ?? DICT.date.weekdays_short.ru;
}

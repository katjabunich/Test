"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { type Lang, tFor, months as monthsFor, weekdaysShort as weekdaysFor } from "./dict";
import { setLanguageAction } from "./actions";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  pending: boolean;
};

const LangCtx = createContext<Ctx>({
  lang: "ru",
  setLang: () => {},
  pending: false,
});

export function LanguageProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  const setLang = useCallback(
    (l: Lang) => {
      startTransition(() => {
        void setLanguageAction(l);
      });
    },
    [startTransition],
  );

  const value = useMemo(
    () => ({ lang: initial, setLang, pending }),
    [initial, setLang, pending],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Lang {
  return useContext(LangCtx).lang;
}

export function useSetLang(): { setLang: (l: Lang) => void; pending: boolean } {
  const { setLang, pending } = useContext(LangCtx);
  return { setLang, pending };
}

/** Returns a translation function bound to the current language. */
export function useT() {
  const lang = useLang();
  return useMemo(() => tFor(lang), [lang]);
}

/** Russian-aware pluralizer for "день / дня / дней". Returns the correct
    word form for the count; English collapses to "day" / "days". */
export function useDaysWord(): (n: number) => string {
  const lang = useLang();
  const t = useT();
  return useMemo(() => {
    return (n: number) => {
      if (lang === "ru") {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return t("habits.day_one");
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
          return t("habits.day_few");
        return t("habits.day_many");
      }
      return n === 1 ? t("habits.day_one") : t("habits.day_many");
    };
  }, [lang, t]);
}

export function useMonths() {
  const lang = useLang();
  return useMemo(() => monthsFor(lang), [lang]);
}

export function useWeekdaysShort() {
  const lang = useLang();
  return useMemo(() => weekdaysFor(lang), [lang]);
}

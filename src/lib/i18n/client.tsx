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

export function useMonths() {
  const lang = useLang();
  return useMemo(() => monthsFor(lang), [lang]);
}

export function useWeekdaysShort() {
  const lang = useLang();
  return useMemo(() => weekdaysFor(lang), [lang]);
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./config";
import { translate, type MessageKey } from "./dictionaries";
import { amountInWords, formatXAF, formatXAFCompact } from "@/lib/money";

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  /** Picks the right half of a bilingual database row. */
  n: (row: { nameFr: string; nameEn: string }) => string;
  money: (amount: number) => string;
  moneyCompact: (amount: number) => string;
  words: (amount: number) => string;
  date: (value: Date | string, withTime?: boolean) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    // A year-long cookie so server components render in the same language
    // on the next navigation, with no flash of the wrong locale.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      n: (row) => (locale === "fr" ? row.nameFr : row.nameEn),
      money: (amount) => formatXAF(amount, locale),
      moneyCompact: (amount) => formatXAFCompact(amount, locale),
      words: (amount) => amountInWords(amount, locale),
      date: (value, withTime = false) => {
        const d = typeof value === "string" ? new Date(value) : value;
        return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        }).format(d);
      },
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>.");
  }
  return context;
}

export { DEFAULT_LOCALE };
export type { Locale, MessageKey };

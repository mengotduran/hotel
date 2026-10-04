export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "frima_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Picks the `fr`/`en` half of a bilingual record coming out of the database. */
export function pickName(
  row: { nameFr: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "fr" ? row.nameFr : row.nameEn;
}

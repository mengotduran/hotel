import type { Locale } from "./i18n/config";

/**
 * All money in this system is an integer number of XAF (FCFA).
 * The franc CFA has no subunit in practice, so there is nothing to round.
 */

export function formatXAF(amount: number, locale: Locale = "fr"): string {
  const sign = amount < 0 ? "-" : "";
  const grouped = Math.abs(Math.round(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return locale === "fr"
    ? `${sign}${grouped} FCFA`
    : `${sign}FCFA ${grouped}`;
}

/** Compact form for dashboard tiles: 1 250 000 -> 1,25 M */
export function formatXAFCompact(amount: number, locale: Locale = "fr"): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const dec = locale === "fr" ? "," : ".";
  const render = (value: number, suffix: string) =>
    `${sign}${value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0).replace(".", dec)} ${suffix}`;

  if (abs >= 1_000_000_000) return render(abs / 1_000_000_000, "Md");
  if (abs >= 1_000_000) return render(abs / 1_000_000, "M");
  if (abs >= 10_000) return render(abs / 1_000, "k");
  return formatXAF(amount, locale).replace(/\s?FCFA\s?/, "").trim();
}

const FR_UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit",
  "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const FR_TENS = [
  "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante",
  "quatre-vingt", "quatre-vingt",
];

/**
 * French agreement rules for `vingt` and `cent`: they take an -s only when
 * multiplied *and* nothing follows them. "Mille" is a numeral adjective, so it
 * suppresses the -s ("quatre-vingt mille"); "million" and "milliard" are nouns,
 * so it survives ("quatre-vingts millions"). `plural` carries that context down.
 */
function frBelowHundred(n: number, plural = true): string {
  if (n < 20) return FR_UNITS[n];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  // 70-79 and 90-99 are built on soixante / quatre-vingt in standard French.
  if (tens === 7 || tens === 9) {
    const base = FR_TENS[tens];
    const rest = frBelowHundred(10 + unit);
    return unit === 1 && tens === 7 ? `${base} et onze` : `${base}-${rest}`;
  }
  if (unit === 0) {
    return tens === 8 ? (plural ? "quatre-vingts" : "quatre-vingt") : FR_TENS[tens];
  }
  if (unit === 1 && tens !== 8) return `${FR_TENS[tens]} et un`;
  return `${FR_TENS[tens]}-${FR_UNITS[unit]}`;
}

function frBelowThousand(n: number, plural = true): string {
  if (n < 100) return frBelowHundred(n, plural);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head =
    hundreds === 1
      ? "cent"
      : `${FR_UNITS[hundreds]} cent${rest === 0 && plural ? "s" : ""}`;
  return rest === 0 ? head : `${head} ${frBelowHundred(rest, plural)}`;
}

const EN_UNITS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
];

function enBelowThousand(n: number): string {
  if (n < 20) return EN_UNITS[n];
  if (n < 100) {
    const tens = EN_TENS[Math.floor(n / 10)];
    const unit = n % 10;
    return unit === 0 ? tens : `${tens}-${EN_UNITS[unit]}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${EN_UNITS[hundreds]} hundred`;
  return rest === 0 ? head : `${head} and ${enBelowThousand(rest)}`;
}

/**
 * Spells an amount out in words, as required on a legally valid cash receipt.
 */
export function amountInWords(amount: number, locale: Locale = "fr"): string {
  const n = Math.abs(Math.round(amount));
  const negative = amount < 0;

  const spell = (value: number): string => {
    if (locale === "fr") {
      if (value === 0) return "zéro";
      const parts: string[] = [];
      const billions = Math.floor(value / 1_000_000_000);
      const millions = Math.floor((value % 1_000_000_000) / 1_000_000);
      const thousands = Math.floor((value % 1_000_000) / 1_000);
      const rest = value % 1_000;

      // "milliard"/"million" are nouns, so a preceding cent/vingt keeps its -s.
      if (billions) {
        parts.push(`${billions === 1 ? "un" : frBelowThousand(billions)} milliard${billions > 1 ? "s" : ""}`);
      }
      if (millions) {
        parts.push(`${millions === 1 ? "un" : frBelowThousand(millions)} million${millions > 1 ? "s" : ""}`);
      }
      // "mille" is a numeral adjective and suppresses that -s.
      if (thousands) {
        parts.push(thousands === 1 ? "mille" : `${frBelowThousand(thousands, false)} mille`);
      }
      if (rest) parts.push(frBelowThousand(rest));
      return parts.join(" ");
    }

    if (value === 0) return "zero";
    const parts: string[] = [];
    const billions = Math.floor(value / 1_000_000_000);
    const millions = Math.floor((value % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((value % 1_000_000) / 1_000);
    const rest = value % 1_000;

    if (billions) parts.push(`${enBelowThousand(billions)} billion`);
    if (millions) parts.push(`${enBelowThousand(millions)} million`);
    if (thousands) parts.push(`${enBelowThousand(thousands)} thousand`);
    if (rest) parts.push(enBelowThousand(rest));
    return parts.join(" ");
  };

  const words = spell(n);
  const prefix = negative ? (locale === "fr" ? "moins " : "minus ") : "";

  // A round million or milliard is a noun, so French needs "de francs".
  const endsOnNoun = n >= 1_000_000 && n % 1_000_000 === 0;
  const currency =
    locale === "fr"
      ? endsOnNoun
        ? "de francs CFA"
        : n === 1
          ? "franc CFA"
          : "francs CFA"
      : n === 1
        ? "CFA franc"
        : "CFA francs";

  const sentence = `${prefix}${words} ${currency}`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

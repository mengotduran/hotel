/** Shared shapes and parsing helpers for every server action. */

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length > 0 ? value : null;
}

/** Money fields arrive as text; anything unparseable becomes 0. */
export function money(form: FormData, key: string): number {
  const raw = str(form, key).replace(/[\s,]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function num(form: FormData, key: string, fallback = 0): number {
  const value = Number(str(form, key));
  return Number.isFinite(value) ? value : fallback;
}

export function int(form: FormData, key: string, fallback = 0): number {
  return Math.round(num(form, key, fallback));
}

export function bool(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

/** Dates come from `<input type="date">` / `datetime-local` in local time. */
export function date(form: FormData, key: string, fallback?: Date): Date {
  const raw = str(form, key);
  if (!raw) return fallback ?? new Date();
  const parsed = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? (fallback ?? new Date()) : parsed;
}

export function optionalDate(form: FormData, key: string): Date | null {
  const raw = str(form, key);
  if (!raw) return null;
  const parsed = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfDay(value: Date): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Nights sold between two dates. Both ends are normalised to midnight first,
 * so the time of day a guest actually hands back the key cannot push a
 * three-night stay onto a fourth night. Never returns less than one.
 */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const from = startOfDay(checkIn).getTime();
  const to = startOfDay(checkOut).getTime();
  return Math.max(Math.round((to - from) / 86_400_000), 1);
}

/** Splits a VAT-inclusive or VAT-exclusive price into net and tax. */
export function splitTax(
  gross: number,
  rate: number,
  inclusive: boolean,
): { net: number; tax: number; total: number } {
  if (rate <= 0) return { net: gross, tax: 0, total: gross };
  if (inclusive) {
    const net = Math.round(gross / (1 + rate / 100));
    return { net, tax: gross - net, total: gross };
  }
  const tax = Math.round((gross * rate) / 100);
  return { net: gross, tax, total: gross + tax };
}

export function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { submitBookingRequest } from "@/lib/actions/bookings";
import { useAction } from "@/components/ui/useAction";
import type { RoomCardData } from "./RoomCard";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const control =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/15";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function BookingForm({
  room,
  range,
}: {
  room: RoomCardData;
  range: { checkIn: string; checkOut: string; nights: number };
}) {
  const { t, locale, money, date } = useI18n();
  const [reference, setReference] = useState<string | null>(null);
  const [nights, setNights] = useState(range.nights);
  const [checkIn, setCheckIn] = useState(range.checkIn);
  const [checkOut, setCheckOut] = useState(range.checkOut);

  const submit = useAction(submitBookingRequest, {
    onSuccess: (data) => setReference(data?.reference ?? null),
  });

  const name = room.name ?? room.number;
  const isHall = room.kind === "HALL";
  const estimate = room.baseRate * (isHall ? 1 : Math.max(nights, 1));

  const recomputeNights = (from: string, to: string) => {
    const a = new Date(`${from}T00:00:00`).getTime();
    const b = new Date(`${to}T00:00:00`).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    setNights(Math.max(Math.round((b - a) / 86_400_000), 1));
  };

  if (reference) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-24 pt-36 sm:px-8">
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e7f3ed] text-2xl text-positive">
            ✓
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-navy">
            {t("site.book.sent")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("site.book.sentLead")}
          </p>

          <div className="mt-6 rounded-lg bg-surface-muted p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t("site.book.reference")}
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold text-navy">
              {reference}
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">{t("site.book.keepReference")}</p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/booking?ref=${reference}`}
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              {t("site.book.trackTitle")}
            </Link>
            <Link
              href="/rooms"
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
            >
              {t("site.nav.rooms")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 sm:pb-28 sm:pt-36 lg:pt-40">
      <Link
        href={`/rooms/${room.slug}?from=${range.checkIn}&to=${range.checkOut}`}
        className="text-sm text-muted transition-colors hover:text-navy"
      >
        ← {name}
      </Link>

      <h1 className="display-lg mt-5 text-navy">
        {t("site.book.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{t("site.book.lead")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
        <form action={submit.run} className="space-y-7">
          <input type="hidden" name="roomSlug" value={room.slug} />

          {submit.error && (
            <p className="rounded-lg border border-[#f0c6c2] bg-[#fbe9e7] px-4 py-3 text-sm text-negative">
              {submit.error}
            </p>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted">
              {t("site.book.yourStay")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("stay.checkIn")} *`}>
                <input
                  type="date"
                  name="checkIn"
                  required
                  value={checkIn}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    recomputeNights(e.target.value, checkOut);
                  }}
                  className={control}
                />
              </Field>
              <Field label={`${t("stay.checkOut")} *`}>
                <input
                  type="date"
                  name="checkOut"
                  required
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    recomputeNights(checkIn, e.target.value);
                  }}
                  className={control}
                />
              </Field>
              <Field label={t("stay.adults")}>
                <input
                  type="number"
                  name="adults"
                  min={1}
                  max={room.capacity}
                  defaultValue={1}
                  className={control}
                />
              </Field>
              <Field
                label={t("stay.children")}
                hint={t(isHall ? "site.rooms.seats" : "site.rooms.capacity").replace(
                  "{n}",
                  String(room.capacity),
                )}
              >
                <input
                  type="number"
                  name="children"
                  min={0}
                  max={room.capacity}
                  defaultValue={0}
                  className={control}
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted">
              {t("site.book.yourDetails")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("site.book.fullName")} *`}>
                <input name="guestName" required className={control} />
              </Field>
              <Field label={`${t("site.book.phone")} *`}>
                <input
                  name="guestPhone"
                  required
                  inputMode="tel"
                  placeholder="+237 6.. .. .. .."
                  className={control}
                />
              </Field>
              <Field label={t("site.book.email")}>
                <input name="guestEmail" type="email" className={control} />
              </Field>
              <Field label={t("site.book.country")}>
                <input name="guestCountry" defaultValue="Cameroun" className={control} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("site.book.message")}>
                  <textarea name="message" rows={3} className={control} />
                </Field>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submit.pending}
            className="w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft disabled:opacity-50 sm:w-auto"
          >
            {submit.pending ? t("site.book.submitting") : t("site.book.submit")}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {room.images[0] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/media/${room.images[0].id}`}
                alt={name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center bg-surface-muted text-xs text-muted">
                {t("site.rooms.noPhoto")}
              </div>
            )}
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-navy">{name}</h3>
              <p className="text-xs uppercase tracking-wide text-muted">
                {t(`room.kind.${room.kind}` as MessageKey)}
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">
                    {money(room.baseRate)}{" "}
                    {t(isHall ? "site.rooms.perDay" : "site.rooms.perNight")}
                  </dt>
                  <dd className="tabular">× {isHall ? 1 : nights}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("stay.checkIn")}</dt>
                  <dd>{date(checkIn)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("stay.checkOut")}</dt>
                  <dd>{date(checkOut)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2.5 font-semibold text-navy">
                  <dt>{t("site.book.total")}</dt>
                  <dd className="tabular">{money(estimate)}</dd>
                </div>
              </dl>

              <p className="mt-4 rounded-lg bg-surface-muted p-3 text-xs leading-relaxed text-muted">
                {t("site.book.pendingNote")} {t("site.book.payOnArrival")}
              </p>
              <p className="mt-2 text-center text-[11px] text-muted">
                {locale === "fr" ? "Sans engagement" : "No commitment"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

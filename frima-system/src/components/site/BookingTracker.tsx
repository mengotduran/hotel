"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { lookupBooking } from "@/lib/actions/bookings";
import type { MessageKey } from "@/lib/i18n/dictionaries";

type Result = {
  reference: string;
  status: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nightlyRate: number;
  declineReason: string | null;
};

const TONE: Record<string, string> = {
  PENDING: "bg-[#fdf3e0] text-warning",
  CONFIRMED: "bg-[#e7f3ed] text-positive",
  DECLINED: "bg-[#fbe9e7] text-negative",
  CANCELLED: "bg-surface-muted text-muted",
};

export function BookingTracker({ initialRef }: { initialRef: string }) {
  const { t, money, date } = useI18n();
  const [reference, setReference] = useState(initialRef);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Starts pending when the page was opened on a deep link, so the first
  // paint already shows the lookup running rather than an empty form.
  const [pending, setPending] = useState(Boolean(initialRef));

  const apply = (response: Awaited<ReturnType<typeof lookupBooking>>) => {
    setPending(false);
    if (response.ok) {
      setResult(response.data);
      setError(null);
    } else {
      setResult(null);
      setError(t("site.book.notFound"));
    }
  };

  const search = async (value: string) => {
    if (!value.trim()) return;
    setPending(true);
    setError(null);
    apply(await lookupBooking(value));
  };

  // Deep link from the confirmation screen fills this in automatically.
  useEffect(() => {
    if (!initialRef) return;
    let cancelled = false;
    void (async () => {
      const response = await lookupBooking(initialRef);
      if (!cancelled) apply(response);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef]);

  return (
    <main className="mx-auto max-w-xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <h1 className="display-lg text-navy">
        {t("site.book.trackTitle")}
      </h1>
      <p className="mt-2 text-muted">{t("site.book.trackLead")}</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(reference);
        }}
        className="mt-7 flex gap-2"
      >
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="DEM-2026-0001"
          className="tabular w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm uppercase outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/15"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
        >
          {pending ? "…" : t("site.book.track")}
        </button>
      </form>

      {error && (
        <p className="mt-5 rounded-lg border border-[#f0c6c2] bg-[#fbe9e7] px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      {result && (
        <article className="mt-7 rounded-xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="tabular font-display text-xl font-bold text-navy">
              {result.reference}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${TONE[result.status] ?? TONE.CANCELLED}`}
            >
              {t(`site.book.status.${result.status}` as MessageKey)}
            </span>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("common.room")}</dt>
              <dd className="font-medium">{result.roomName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("stay.checkIn")}</dt>
              <dd>{date(result.checkIn)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("stay.checkOut")}</dt>
              <dd>{date(result.checkOut)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("stay.nightlyRate")}</dt>
              <dd className="tabular">{money(result.nightlyRate)}</dd>
            </div>
          </dl>

          <p className="mt-5 rounded-lg bg-surface-muted p-4 text-xs leading-relaxed text-muted">
            {result.status === "PENDING" && t("site.book.pendingNote")}
            {result.status === "CONFIRMED" && t("site.book.confirmedNote")}
            {result.status === "DECLINED" &&
              (result.declineReason ?? t("site.book.status.DECLINED"))}
          </p>
        </article>
      )}

      <p className="mt-8 text-center text-sm">
        <Link href="/rooms" className="text-navy hover:underline">
          {t("site.nav.rooms")} →
        </Link>
      </p>
    </main>
  );
}

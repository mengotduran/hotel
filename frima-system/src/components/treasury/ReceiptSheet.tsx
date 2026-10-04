"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Kit";
import { IconPrint } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface ReceiptSheetData {
  number: string;
  issuedAt: string;
  payerName: string;
  amount: number;
  method: string;
  issuedBy: string | null;
  cancelled: boolean;
  cancelReason: string | null;
  invoiceNumber: string | null;
  invoiceId: string | null;
  notes: string | null;
  hotel: {
    name: string;
    tagline: string;
    address: string;
    city: string;
    country: string;
    phones: string;
    taxId: string;
  };
}

export function ReceiptSheet({ data }: { data: ReceiptSheetData }) {
  const { t, money, words, date, locale } = useI18n();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/admin/receipts"
          className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
        >
          {t("common.back")}
        </Link>
        <Button variant="gold" onClick={() => window.print()}>
          <IconPrint className="h-4 w-4" />
          {t("receipt.print")}
        </Button>
      </div>

      <article className="print-sheet mx-auto max-w-2xl rounded-xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(16,32,46,0.04)]">
        <header className="flex items-start justify-between gap-6 border-b-2 border-navy pb-5">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-navy text-lg font-bold text-gold">
              F
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-navy">
                {data.hotel.name}
              </h1>
              <p className="text-xs italic text-muted">{data.hotel.tagline}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {data.hotel.address}
                {data.hotel.city ? `, ${data.hotel.city}` : ""}
                <br />
                {data.hotel.phones}
                {data.hotel.taxId && (
                  <>
                    <br />
                    {t("settings.taxId")} : {data.hotel.taxId}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t("receipt.number")}
            </p>
            <p className="tabular text-xl font-bold text-navy">{data.number}</p>
            <p className="mt-1 text-xs text-muted">{date(data.issuedAt)}</p>
            {data.cancelled && (
              <p className="mt-2 rounded border-2 border-negative px-2 py-0.5 text-xs font-bold tracking-widest text-negative">
                {t("receipt.cancelled")}
              </p>
            )}
          </div>
        </header>

        <section className="py-7">
          <dl className="space-y-4 text-sm">
            <div className="flex gap-3">
              <dt className="w-40 shrink-0 text-muted">{t("payment.payer")}</dt>
              <dd className="flex-1 border-b border-dotted border-line pb-1 font-medium">
                {data.payerName}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-40 shrink-0 text-muted">{t("common.method")}</dt>
              <dd className="flex-1 border-b border-dotted border-line pb-1">
                {t(`payment.method.${data.method}` as MessageKey)}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-40 shrink-0 text-muted">{t("receipt.forAccountOf")}</dt>
              <dd className="flex-1 border-b border-dotted border-line pb-1">
                {data.invoiceNumber
                  ? `${t("invoice.number")} ${data.invoiceNumber}`
                  : (data.notes ?? "—")}
              </dd>
            </div>
          </dl>

          <div className="mt-7 rounded-lg bg-[#f6f7f9] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t("receipt.amountInWords")}
            </p>
            <p className="mt-1.5 text-sm font-medium italic leading-relaxed text-navy">
              {words(data.amount)}
            </p>
            <p className="tabular mt-4 text-3xl font-bold text-navy">
              {money(data.amount)}
            </p>
          </div>

          {data.cancelled && data.cancelReason && (
            <p className="mt-5 rounded-lg border border-[#f0c6c2] bg-[#fbe9e7] p-3 text-xs text-negative">
              {t("receipt.cancelled")} · {data.cancelReason}
            </p>
          )}
        </section>

        <footer className="flex items-end justify-between gap-6 border-t border-line pt-6">
          <p className="text-[11px] leading-relaxed text-muted">
            {locale === "fr"
              ? "Ce reçu est établi en un exemplaire original et fait foi du règlement."
              : "This receipt is issued as a single original and evidences payment."}
          </p>
          <div className="shrink-0 text-center">
            <p className="text-[11px] text-muted">{t("receipt.signature")}</p>
            <div className="mt-10 w-44 border-t border-foreground pt-1.5">
              <p className="text-xs text-muted">
                {data.issuedBy || t("receipt.issuedBy")}
              </p>
            </div>
          </div>
        </footer>
      </article>
    </>
  );
}

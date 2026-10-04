"use client";

import { Fragment, Suspense } from "react";
import { useI18n } from "@/lib/i18n/context";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { Button, Card, EmptyState, PageHeader, StatTile, Table, Td, Th } from "@/components/ui/Kit";
import { IconPrint } from "@/components/ui/Icons";

export interface TrialBalanceRow {
  code: string;
  nameFr: string;
  nameEn: string;
  klass: number;
  debit: number;
  credit: number;
  debitBalance: number;
  creditBalance: number;
}

const CLASS_LABELS: Record<number, { fr: string; en: string }> = {
  1: { fr: "Ressources durables", en: "Long-term resources" },
  2: { fr: "Actif immobilisé", en: "Fixed assets" },
  3: { fr: "Stocks", en: "Inventories" },
  4: { fr: "Tiers", en: "Third parties" },
  5: { fr: "Trésorerie", en: "Treasury" },
  6: { fr: "Charges", en: "Expenses" },
  7: { fr: "Produits", en: "Income" },
};

export function TrialBalanceView({
  rows,
  totals,
  period,
  hotelName,
}: {
  rows: TrialBalanceRow[];
  totals: { debit: number; credit: number; debitBalance: number; creditBalance: number };
  period: { from: string; to: string };
  hotelName: string;
}) {
  const { t, n, locale, money, date } = useI18n();
  const balanced = totals.debit === totals.credit;

  const classes = [...new Set(rows.map((r) => r.klass))].sort();

  return (
    <>
      <PageHeader
        title={t("acct.trialBalance")}
        subtitle={t("acct.trialBalanceSubtitle")}
        actions={
          <>
            <Suspense fallback={null}>
              <PeriodPicker from={period.from} to={period.to} />
            </Suspense>
            <Button variant="secondary" onClick={() => window.print()}>
              <IconPrint className="h-4 w-4" />
              {t("common.print")}
            </Button>
          </>
        }
      />

      <div className="mb-5 hidden print:block">
        <h2 className="text-lg font-bold text-navy">{hotelName}</h2>
        <p className="text-sm text-muted">
          {t("acct.trialBalance")} · {date(period.from)} → {date(period.to)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("acct.debit")} value={money(totals.debit)} />
        <StatTile label={t("acct.credit")} value={money(totals.credit)} />
        <StatTile
          label={balanced ? t("acct.balanced") : t("acct.unbalanced")}
          value={money(totals.debit - totals.credit)}
          tone={balanced ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6">
        <Card subtitle={t("acct.standard")} bodyClassName="p-5 pt-3">
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("acct.accountCode")}</Th>
                  <Th>{t("acct.account")}</Th>
                  <Th align="right">{t("acct.debit")}</Th>
                  <Th align="right">{t("acct.credit")}</Th>
                  <Th align="right">{`${t("common.balance")} ${t("acct.debit")}`}</Th>
                  <Th align="right">{`${t("common.balance")} ${t("acct.credit")}`}</Th>
                </tr>
              </thead>
              <tbody>
                {classes.map((klass) => (
                  <Fragment key={klass}>
                    <tr>
                      <Td colSpan={6} className="bg-surface-muted text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        {locale === "fr"
                          ? `Classe ${klass} · ${CLASS_LABELS[klass]?.fr ?? ""}`
                          : `Class ${klass} · ${CLASS_LABELS[klass]?.en ?? ""}`}
                      </Td>
                    </tr>
                    {rows
                      .filter((row) => row.klass === klass)
                      .map((row) => (
                        <tr key={row.code}>
                          <Td className="tabular font-medium">{row.code}</Td>
                          <Td>{n(row)}</Td>
                          <Td align="right">{row.debit > 0 ? money(row.debit) : ""}</Td>
                          <Td align="right">{row.credit > 0 ? money(row.credit) : ""}</Td>
                          <Td align="right" className="font-medium">
                            {row.debitBalance > 0 ? money(row.debitBalance) : ""}
                          </Td>
                          <Td align="right" className="font-medium">
                            {row.creditBalance > 0 ? money(row.creditBalance) : ""}
                          </Td>
                        </tr>
                      ))}
                  </Fragment>
                ))}
                <tr>
                  <Td colSpan={2} className="font-semibold">{t("common.total")}</Td>
                  <Td align="right" className="font-semibold">{money(totals.debit)}</Td>
                  <Td align="right" className="font-semibold">{money(totals.credit)}</Td>
                  <Td align="right" className="font-semibold">{money(totals.debitBalance)}</Td>
                  <Td align="right" className="font-semibold">{money(totals.creditBalance)}</Td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

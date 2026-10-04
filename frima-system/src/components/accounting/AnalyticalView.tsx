"use client";

import { Suspense } from "react";
import { useI18n } from "@/lib/i18n/context";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { Button, Card, EmptyState, PageHeader, StatTile, Table, Td, Th } from "@/components/ui/Kit";
import { IconPrint } from "@/components/ui/Icons";

export interface AnalyticalColumn {
  id: string | null;
  nameFr: string;
  nameEn: string;
  colour: string;
}

export interface AnalyticalRow {
  code: string;
  nameFr: string;
  nameEn: string;
  cells: number[];
  total: number;
}

export function AnalyticalView({
  columns,
  revenue,
  expenses,
  revenueTotals,
  expenseTotals,
  resultTotals,
  period,
  hotelName,
}: {
  columns: AnalyticalColumn[];
  revenue: AnalyticalRow[];
  expenses: AnalyticalRow[];
  revenueTotals: number[];
  expenseTotals: number[];
  resultTotals: number[];
  period: { from: string; to: string };
  hotelName: string;
}) {
  const { t, n, money, date } = useI18n();

  const grandRevenue = revenueTotals.reduce((a, b) => a + b, 0);
  const grandExpenses = expenseTotals.reduce((a, b) => a + b, 0);
  const grandResult = grandRevenue - grandExpenses;

  const section = (
    title: string,
    rows: AnalyticalRow[],
    totals: number[],
    tone: string,
  ) => (
    <>
      <tr>
        <Td
          colSpan={columns.length + 2}
          className="bg-surface-muted text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          {title}
        </Td>
      </tr>
      {rows.length === 0 ? (
        <tr>
          <Td colSpan={columns.length + 2} className="text-center text-xs text-muted">
            —
          </Td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={`${title}-${row.code}`}>
            <Td className="tabular text-xs font-medium">{row.code}</Td>
            <Td>{n(row)}</Td>
            {row.cells.map((value, index) => (
              <Td key={index} align="right">
                {value !== 0 ? money(value) : ""}
              </Td>
            ))}
            <Td align="right" className="font-medium">{money(row.total)}</Td>
          </tr>
        ))
      )}
      <tr>
        <Td colSpan={2} className={`font-semibold ${tone}`}>
          {t("common.total")} · {title}
        </Td>
        {totals.map((value, index) => (
          <Td key={index} align="right" className={`font-semibold ${tone}`}>
            {money(value)}
          </Td>
        ))}
        <Td align="right" className={`font-semibold ${tone}`}>
          {money(totals.reduce((a, b) => a + b, 0))}
        </Td>
      </tr>
    </>
  );

  return (
    <>
      <PageHeader
        title={t("acct.analytical")}
        subtitle={t("acct.analyticalSubtitle")}
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
          {t("acct.analytical")} · {date(period.from)} → {date(period.to)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("dept.revenue")} value={money(grandRevenue)} tone="positive" />
        <StatTile label={t("dept.directCosts")} value={money(grandExpenses)} tone="negative" />
        <StatTile
          label={t("dept.result")}
          value={money(grandResult)}
          tone={grandResult >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6">
        <Card subtitle={t("acct.standard")} bodyClassName="p-5 pt-3">
          {revenue.length === 0 && expenses.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("acct.accountCode")}</Th>
                  <Th>{t("acct.account")}</Th>
                  {columns.map((column, index) => (
                    <Th key={index} align="right">
                      <span
                        className="inline-block border-b-2 pb-0.5"
                        style={{ borderColor: column.colour }}
                      >
                        {n(column)}
                      </span>
                    </Th>
                  ))}
                  <Th align="right">{t("common.total")}</Th>
                </tr>
              </thead>
              <tbody>
                {section(t("dept.revenue"), revenue, revenueTotals, "text-positive")}
                {section(t("dept.directCosts"), expenses, expenseTotals, "text-negative")}
                <tr>
                  <Td colSpan={2} className="text-base font-bold text-navy">
                    {t("dept.result")}
                  </Td>
                  {resultTotals.map((value, index) => (
                    <Td
                      key={index}
                      align="right"
                      className={`text-base font-bold ${value >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {money(value)}
                    </Td>
                  ))}
                  <Td
                    align="right"
                    className={`text-base font-bold ${grandResult >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {money(grandResult)}
                  </Td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

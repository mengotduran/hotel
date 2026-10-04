"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n/context";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { Card, EmptyState, PageHeader, ShareBar, StatTile, Table, Td, Th } from "@/components/ui/Kit";

export interface DashboardData {
  periodLabel: { from: string; to: string };
  revenue: number;
  expenses: number;
  margin: number;
  marginRate: number;
  occupancy: {
    lettable: number;
    occupied: number;
    rate: number;
    arrivals: number;
    departures: number;
    inHouse: number;
  };
  treasury: { cash: number; bank: number; mobile: number; total: number };
  thirdParties: {
    clientsReceivable: number;
    clientAdvances: number;
    suppliersPayable: number;
  };
  revenueByDepartment: {
    code: string;
    nameFr: string;
    nameEn: string;
    colour: string;
    amount: number;
  }[];
  expensesByCategory: {
    code: string;
    nameFr: string;
    nameEn: string;
    amount: number;
  }[];
  recentPayments: {
    id: string;
    reference: string;
    payerName: string;
    amount: number;
    method: string;
    receivedAt: string;
    receiptNumber: string | null;
  }[];
  recentExpenses: {
    id: string;
    reference: string;
    description: string;
    total: number;
    incurredAt: string;
    categoryNameFr: string;
    categoryNameEn: string;
  }[];
}

export function DashboardView({ data }: { data: DashboardData }) {
  const { t, n, money, moneyCompact, date, locale } = useI18n();

  const revenueTotal = data.revenueByDepartment.reduce((s, d) => s + d.amount, 0);
  const expenseTotal = data.expensesByCategory.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <PageHeader
        title={t("dash.title")}
        subtitle={`${t("dash.subtitle")} · ${date(data.periodLabel.from)} → ${date(data.periodLabel.to)}`}
        actions={
          <Suspense fallback={null}>
            <PeriodPicker from={data.periodLabel.from} to={data.periodLabel.to} />
          </Suspense>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("dash.revenue")} value={money(data.revenue)} tone="positive" />
        <StatTile label={t("dash.expenses")} value={money(data.expenses)} tone="negative" />
        <StatTile
          label={t("dash.margin")}
          value={money(data.margin)}
          tone={data.margin >= 0 ? "positive" : "negative"}
          hint={`${t("dash.marginRate")} ${
            data.revenue > 0 ? `${(data.marginRate * 100).toFixed(1)} %` : "—"
          }`}
        />
        <StatTile
          label={t("dash.occupancyRate")}
          value={`${(data.occupancy.rate * 100).toFixed(0)} %`}
          tone="gold"
          hint={`${data.occupancy.occupied} / ${data.occupancy.lettable} ${t("dash.roomsOccupied").toLowerCase()}`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t("dash.cashPosition")}
          value={money(data.treasury.total)}
          hint={`${t("payment.method.CASH")} ${moneyCompact(data.treasury.cash)} · ${t("payment.method.BANK_TRANSFER")} ${moneyCompact(data.treasury.bank)} · MoMo ${moneyCompact(data.treasury.mobile)}`}
        />
        <StatTile
          label={t("dash.clientsReceivable")}
          value={money(data.thirdParties.clientsReceivable)}
          tone={data.thirdParties.clientsReceivable > 0 ? "negative" : "neutral"}
        />
        <StatTile
          label={t("dash.suppliersPayable")}
          value={money(data.thirdParties.suppliersPayable)}
          tone={data.thirdParties.suppliersPayable > 0 ? "negative" : "neutral"}
        />
        <StatTile
          label={t("dash.inHouse")}
          value={String(data.occupancy.inHouse)}
          hint={`${t("dash.arrivalsToday")} ${data.occupancy.arrivals} · ${t("dash.departuresToday")} ${data.occupancy.departures}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title={t("dash.revenueByDepartment")}>
          <ShareBar
            rows={data.revenueByDepartment.map((d) => ({
              label: n(d),
              value: money(d.amount),
              share: revenueTotal > 0 ? d.amount / revenueTotal : 0,
              colour: d.colour,
            }))}
          />
        </Card>

        <Card title={t("dash.expensesByCategory")}>
          <ShareBar
            rows={data.expensesByCategory.map((c) => ({
              label: n(c),
              value: money(c.amount),
              share: expenseTotal > 0 ? c.amount / expenseTotal : 0,
              colour: "#b4342a",
            }))}
          />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title={t("dash.recentPayments")}
          actions={
            <Link href="/admin/payments" className="text-xs font-medium text-info hover:underline">
              {t("common.view")}
            </Link>
          }
        >
          {data.recentPayments.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("payment.payer")}</Th>
                  <Th>{t("receipt.number")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <Td className="whitespace-nowrap text-muted">{date(p.receivedAt)}</Td>
                    <Td className="max-w-[18ch] truncate">{p.payerName}</Td>
                    <Td>
                      {p.receiptNumber ? (
                        <span className="tabular text-xs text-muted">{p.receiptNumber}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </Td>
                    <Td align="right" className="font-medium">{money(p.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card
          title={t("dash.recentExpenses")}
          actions={
            <Link href="/admin/expenses" className="text-xs font-medium text-info hover:underline">
              {t("common.view")}
            </Link>
          }
        >
          {data.recentExpenses.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("common.description")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentExpenses.map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap text-muted">{date(e.incurredAt)}</Td>
                    <Td>
                      <span className="block max-w-[24ch] truncate">{e.description}</span>
                      <span className="text-xs text-muted">
                        {locale === "fr" ? e.categoryNameFr : e.categoryNameEn}
                      </span>
                    </Td>
                    <Td align="right" className="font-medium">{money(e.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

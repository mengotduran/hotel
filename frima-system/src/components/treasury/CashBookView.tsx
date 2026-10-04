"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  Button, Card, EmptyState, Input, PageHeader, StatTile, Table, Td, Th,
} from "@/components/ui/Kit";
import { IconPrint } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface CashBookData {
  date: string;
  opening: number;
  inflow: number;
  outflow: number;
  net: number;
  closing: number;
  byMethodIn: [string, number][];
  byMethodOut: [string, number][];
  collections: {
    id: string;
    reference: string;
    receiptNumber: string | null;
    payerName: string;
    invoiceNumber: string | null;
    method: string;
    amount: number;
  }[];
  disbursements: {
    id: string;
    reference: string;
    description: string;
    categoryCode: string;
    departmentName: { fr: string; en: string } | null;
    supplierName: string | null;
    method: string;
    total: number;
    paid: boolean;
  }[];
  hotelName: string;
}

export function CashBookView({ data }: { data: CashBookData }) {
  const { t, locale, money, date } = useI18n();
  const router = useRouter();

  return (
    <>
      <PageHeader
        title={t("cash.title")}
        subtitle={t("cash.subtitle")}
        actions={
          <>
            <Input
              type="date"
              value={data.date}
              onChange={(e) => router.push(`/cashbook?date=${e.target.value}`)}
              className="w-auto"
              aria-label={t("common.date")}
            />
            <Button variant="secondary" onClick={() => window.print()}>
              <IconPrint className="h-4 w-4" />
              {t("common.print")}
            </Button>
          </>
        }
      />

      <div className="mb-5 hidden print:block">
        <h2 className="text-lg font-bold text-navy">{data.hotelName}</h2>
        <p className="text-sm text-muted">
          {t("cash.title")} · {date(data.date)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label={t("cash.opening")} value={money(data.opening)} />
        <StatTile label={t("cash.inflows")} value={money(data.inflow)} tone="positive" />
        <StatTile label={t("cash.outflows")} value={money(data.outflow)} tone="negative" />
        <StatTile
          label={t("cash.netFlow")}
          value={money(data.net)}
          tone={data.net >= 0 ? "positive" : "negative"}
        />
        <StatTile label={t("cash.closing")} value={money(data.closing)} tone="gold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title={t("cash.inflows")}
          subtitle={data.byMethodIn
            .map(([method, amount]) => `${t(`payment.method.${method}` as MessageKey)} ${money(amount)}`)
            .join(" · ")}
          bodyClassName="p-5 pt-3"
        >
          {data.collections.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("receipt.number")}</Th>
                  <Th>{t("payment.payer")}</Th>
                  <Th>{t("common.method")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.collections.map((row) => (
                  <tr key={row.id}>
                    <Td className="tabular text-xs text-muted">
                      {row.receiptNumber ?? row.reference}
                    </Td>
                    <Td>
                      <span className="block max-w-[20ch] truncate">{row.payerName}</span>
                      {row.invoiceNumber && (
                        <span className="tabular text-xs text-muted">{row.invoiceNumber}</span>
                      )}
                    </Td>
                    <Td className="text-xs text-muted">
                      {t(`payment.method.${row.method}` as MessageKey)}
                    </Td>
                    <Td align="right" className="font-medium">{money(row.amount)}</Td>
                  </tr>
                ))}
                <tr>
                  <Td colSpan={3} className="font-semibold">{t("common.total")}</Td>
                  <Td align="right" className="font-semibold text-positive">
                    {money(data.inflow)}
                  </Td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card>

        <Card
          title={t("cash.outflows")}
          subtitle={data.byMethodOut
            .map(([method, amount]) => `${t(`payment.method.${method}` as MessageKey)} ${money(amount)}`)
            .join(" · ")}
          bodyClassName="p-5 pt-3"
        >
          {data.disbursements.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("common.description")}</Th>
                  <Th>{t("common.department")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.disbursements.map((row) => (
                  <tr key={row.id} className={row.paid ? "" : "opacity-60"}>
                    <Td className="tabular text-xs text-muted">{row.reference}</Td>
                    <Td>
                      <span className="block max-w-[22ch] truncate">{row.description}</span>
                      <span className="text-xs text-muted">
                        {t(`expense.cat.${row.categoryCode}` as MessageKey)}
                        {!row.paid && ` · ${t("expense.unpaid")}`}
                      </span>
                    </Td>
                    <Td className="text-xs text-muted">
                      {row.departmentName
                        ? locale === "fr"
                          ? row.departmentName.fr
                          : row.departmentName.en
                        : "—"}
                    </Td>
                    <Td align="right" className="font-medium">{money(row.total)}</Td>
                  </tr>
                ))}
                <tr>
                  <Td colSpan={3} className="font-semibold">{t("common.total")}</Td>
                  <Td align="right" className="font-semibold text-negative">
                    {money(data.outflow)}
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

"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Badge, Card, EmptyState, PageHeader, StatTile, Table, Td, Th } from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface ReceiptRow {
  id: string;
  number: string;
  sequence: number;
  issuedAt: string;
  payerName: string;
  amount: number;
  method: string;
  cancelled: boolean;
  cancelReason: string | null;
  invoiceNumber: string | null;
}

export function ReceiptsView({
  receipts,
  totals,
}: {
  receipts: ReceiptRow[];
  totals: { issued: number; cancelled: number; collected: number };
}) {
  const { t, money, date } = useI18n();
  const { page, setPage, totalPages, pageRows } = usePagination(receipts, 25);

  return (
    <>
      <PageHeader title={t("receipt.title")} subtitle={t("receipt.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("receipt.title")} value={String(totals.issued)} />
        <StatTile label={t("receipt.cancelled")} value={String(totals.cancelled)} tone="negative" />
        <StatTile label={t("cash.inflows")} value={money(totals.collected)} tone="positive" />
      </div>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {receipts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("receipt.number")}</Th>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("payment.payer")}</Th>
                  <Th>{t("invoice.number")}</Th>
                  <Th>{t("common.method")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((receipt) => (
                  <tr key={receipt.id} className={receipt.cancelled ? "opacity-60" : ""}>
                    <Td>
                      <Link
                        href={`/admin/receipts/${receipt.id}`}
                        className="tabular font-medium text-navy hover:underline"
                      >
                        {receipt.number}
                      </Link>
                      {receipt.cancelled && (
                        <Badge tone="negative">{t("receipt.cancelled")}</Badge>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{date(receipt.issuedAt)}</Td>
                    <Td>{receipt.payerName}</Td>
                    <Td className="tabular text-xs text-muted">
                      {receipt.invoiceNumber ?? "—"}
                    </Td>
                    <Td className="text-muted">
                      {t(`payment.method.${receipt.method}` as MessageKey)}
                    </Td>
                    <Td
                      align="right"
                      className={receipt.cancelled ? "line-through" : "font-medium"}
                    >
                      {money(receipt.amount)}
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/receipts/${receipt.id}`}
                        className="text-xs font-medium text-info hover:underline"
                      >
                        {t("common.print")}
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      </div>
    </>
  );
}

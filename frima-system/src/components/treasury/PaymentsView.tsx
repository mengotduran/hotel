"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cancelPayment, recordPayment } from "@/lib/actions/treasury";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, StatTile, Table, Td, Th, Textarea,
} from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { IconPlus } from "@/components/ui/Icons";
import { PAYMENT_METHODS } from "@/lib/accounting/chart";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface PaymentRow {
  id: string;
  reference: string;
  payerName: string;
  clientId: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  amount: number;
  method: string;
  receivedAt: string;
  cancelled: boolean;
  receiptId: string | null;
  receiptNumber: string | null;
  notes: string | null;
}

export function PaymentsView({
  payments,
  openInvoices,
  clients,
  today,
  totals,
}: {
  payments: PaymentRow[];
  openInvoices: {
    id: string;
    number: string;
    clientName: string;
    remaining: number;
  }[];
  clients: { id: string; name: string; code: string }[];
  today: string;
  totals: { today: number; month: number; count: number };
}) {
  const { t, money, date } = useI18n();
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<PaymentRow | null>(null);
  const { page, setPage, totalPages, pageRows } = usePagination(payments, 25);
  const [reason, setReason] = useState("");
  const [advance, setAdvance] = useState(false);

  const record = useAction(recordPayment, { onSuccess: () => setCreating(false) });
  const drop = useAction(cancelPayment, {
    onSuccess: () => {
      setCancelling(null);
      setReason("");
    },
  });

  return (
    <>
      <PageHeader
        title={t("payment.title")}
        subtitle={t("payment.subtitle")}
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" />
            {t("payment.new")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("common.today")} value={money(totals.today)} tone="positive" />
        <StatTile label={t("common.period")} value={money(totals.month)} />
        <StatTile label={t("receipt.title")} value={String(totals.count)} />
      </div>

      <ErrorNote>{drop.error}</ErrorNote>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {payments.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("receipt.number")}</Th>
                  <Th>{t("payment.payer")}</Th>
                  <Th>{t("invoice.number")}</Th>
                  <Th>{t("common.method")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((payment) => (
                  <tr key={payment.id} className={payment.cancelled ? "opacity-50" : ""}>
                    <Td className="whitespace-nowrap text-muted">{date(payment.receivedAt)}</Td>
                    <Td>
                      {payment.receiptId ? (
                        <Link
                          href={`/admin/receipts/${payment.receiptId}`}
                          className="tabular text-xs font-medium text-navy hover:underline"
                        >
                          {payment.receiptNumber}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      {payment.clientId ? (
                        <Link href={`/admin/clients/${payment.clientId}`} className="hover:underline">
                          {payment.payerName}
                        </Link>
                      ) : (
                        payment.payerName
                      )}
                    </Td>
                    <Td>
                      {payment.invoiceId ? (
                        <Link
                          href={`/admin/invoices/${payment.invoiceId}`}
                          className="tabular text-xs text-info hover:underline"
                        >
                          {payment.invoiceNumber}
                        </Link>
                      ) : (
                        <Badge tone="gold">{t("invoice.status.OPEN")}</Badge>
                      )}
                    </Td>
                    <Td className="text-muted">
                      {t(`payment.method.${payment.method}` as MessageKey)}
                    </Td>
                    <Td
                      align="right"
                      className={payment.cancelled ? "line-through" : "font-medium"}
                    >
                      {money(payment.amount)}
                    </Td>
                    <Td align="right">
                      {payment.cancelled ? (
                        <Badge tone="negative">{t("payment.cancelled")}</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => setCancelling(payment)}
                          className="px-2 py-1 text-xs"
                        >
                          {t("common.cancel")}
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      </div>

      <Modal
        open={creating}
        title={t("payment.new")}
        onClose={() => {
          setCreating(false);
          record.clearError();
        }}
      >
        <form action={record.run} className="space-y-4">
          <ErrorNote>{record.error}</ErrorNote>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={advance}
              onChange={(e) => setAdvance(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            {t("invoice.status.OPEN")} · {t("common.none")} {t("invoice.number").toLowerCase()}
          </label>

          {advance ? (
            <>
              <Field label={t("common.client")} hint={t("common.optional")}>
                <Select name="clientId" defaultValue="">
                  <option value="">—</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.code})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`${t("payment.payer")} *`}>
                <Input name="payerName" required />
              </Field>
            </>
          ) : (
            <Field label={`${t("invoice.number")} *`}>
              <Select name="invoiceId" required defaultValue="">
                <option value="" disabled>—</option>
                {openInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number} · {invoice.clientName} ({money(invoice.remaining)})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.amount")} (FCFA) *`}>
              <Input name="amount" type="number" min={1} required />
            </Field>
            <Field label={`${t("common.method")} *`}>
              <Select name="method" defaultValue="CASH">
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`payment.method.${method}` as MessageKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("payment.receivedAt")}>
              <Input name="receivedAt" type="date" defaultValue={today} />
            </Field>
            <Field label={t("receipt.issuedBy")}>
              <Input name="issuedBy" />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={record.pending}>
              {record.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cancelling !== null}
        title={`${t("common.cancel")} · ${cancelling?.receiptNumber ?? ""}`}
        onClose={() => {
          setCancelling(null);
          drop.clearError();
        }}
      >
        <div className="space-y-4">
          <ErrorNote>{drop.error}</ErrorNote>
          <p className="text-sm text-muted">
            {t("receipt.subtitle")} · {money(cancelling?.amount ?? 0)}
          </p>
          <Field label={`${t("common.notes")} *`}>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCancelling(null)}>
              {t("common.close")}
            </Button>
            <Button
              variant="danger"
              disabled={drop.pending || reason.trim().length === 0}
              onClick={() => cancelling && drop.run(cancelling.id, reason)}
            >
              {drop.pending ? t("common.saving") : t("common.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

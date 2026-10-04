"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { addLine, cancelInvoice, issueInvoice, removeLine } from "@/lib/actions/invoices";
import { recordPayment } from "@/lib/actions/treasury";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, Table, Td, Th, Textarea,
} from "@/components/ui/Kit";
import { IconPlus, IconPrint } from "@/components/ui/Icons";
import { PAYMENT_METHODS } from "@/lib/accounting/chart";
import { INVOICE_TONE } from "./InvoicesView";
import { ACCOMMODATION_LINE_TAG } from "@/lib/folio";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface InvoiceDetailData {
  id: string;
  number: string;
  status: string;
  issuedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  paidTotal: number;
  notes: string | null;
  client: { id: string; name: string; code: string; phone: string | null };
  lines: {
    id: string;
    description: string;
    departmentName: { fr: string; en: string };
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
    taxAmount: number;
    total: number;
    occurredAt: string;
  }[];
  payments: {
    id: string;
    reference: string;
    amount: number;
    method: string;
    receivedAt: string;
    cancelled: boolean;
    receiptId: string | null;
    receiptNumber: string | null;
  }[];
}

export function InvoiceDetail({
  invoice,
  departments,
  serviceItems,
  today,
}: {
  invoice: InvoiceDetailData;
  departments: { id: string; nameFr: string; nameEn: string }[];
  serviceItems: {
    id: string;
    code: string;
    nameFr: string;
    nameEn: string;
    unitPrice: number;
    departmentId: string;
  }[];
  today: string;
}) {
  const { t, n, locale, money, date } = useI18n();
  const [addingLine, setAddingLine] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [freeForm, setFreeForm] = useState(false);

  const line = useAction(addLine, { onSuccess: () => setAddingLine(false) });
  const drop = useAction(removeLine);
  const issue = useAction(issueInvoice, { onSuccess: () => setIssuing(false) });
  const cancel = useAction(cancelInvoice);
  const pay = useAction(recordPayment, { onSuccess: () => setPaying(false) });

  const isOpen = invoice.status === "OPEN";
  const remaining = invoice.total - invoice.paidTotal;
  const canPay =
    (invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID") && remaining > 0;

  /** Room-night lines carry an internal marker so they can be re-synced. */
  const label = (description: string) =>
    description.startsWith(ACCOMMODATION_LINE_TAG)
      ? `${t("common.nights")} · ${description.slice(ACCOMMODATION_LINE_TAG.length)}`
      : description;

  return (
    <>
      <PageHeader
        title={invoice.number}
        subtitle={`${invoice.client.name} · ${invoice.client.code}`}
        actions={
          <>
            <Link
              href="/admin/invoices"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              {t("common.back")}
            </Link>
            {isOpen && (
              <Button variant="gold" onClick={() => setIssuing(true)}>
                {t("invoice.issue")}
              </Button>
            )}
            {canPay && (
              <Button variant="primary" onClick={() => setPaying(true)}>
                {t("payment.new")}
              </Button>
            )}
            {invoice.status !== "CANCELLED" && invoice.payments.filter((p) => !p.cancelled).length === 0 && (
              <Button variant="danger" onClick={() => cancel.run(invoice.id)}>
                {t("common.cancel")}
              </Button>
            )}
            <Button variant="secondary" onClick={() => window.print()}>
              <IconPrint className="h-4 w-4" />
              {t("common.print")}
            </Button>
          </>
        }
      />

      <ErrorNote>{drop.error ?? cancel.error}</ErrorNote>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title={t("invoice.lines")}
            actions={
              isOpen ? (
                <Button
                  variant="secondary"
                  onClick={() => setAddingLine(true)}
                  className="px-2.5 py-1 text-xs"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  {t("invoice.addLine")}
                </Button>
              ) : null
            }
            bodyClassName="p-5 pt-3"
          >
            {invoice.lines.length === 0 ? (
              <EmptyState />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("common.date")}</Th>
                    <Th>{t("common.description")}</Th>
                    <Th>{t("common.department")}</Th>
                    <Th align="right">{t("common.quantity")}</Th>
                    <Th align="right">{t("common.unitPrice")}</Th>
                    <Th align="right">{t("common.total")}</Th>
                    {isOpen && <Th />}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((row) => (
                    <tr key={row.id}>
                      <Td className="whitespace-nowrap text-xs text-muted">
                        {date(row.occurredAt)}
                      </Td>
                      <Td>{label(row.description)}</Td>
                      <Td className="text-xs text-muted">
                        {locale === "fr" ? row.departmentName.fr : row.departmentName.en}
                      </Td>
                      <Td align="right">{row.quantity}</Td>
                      <Td align="right">{money(row.unitPrice)}</Td>
                      <Td align="right" className="font-medium">{money(row.total)}</Td>
                      {isOpen && (
                        <Td align="right">
                          <Button
                            variant="ghost"
                            disabled={drop.pending}
                            onClick={() => drop.run(row.id)}
                            className="px-2 py-1 text-xs"
                          >
                            ✕
                          </Button>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t("common.subtotal")}</dt>
                <dd className="tabular">{money(invoice.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("common.tax")}</dt>
                <dd className="tabular">{money(invoice.taxTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-navy">
                <dt>{t("common.total")}</dt>
                <dd className="tabular">{money(invoice.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("invoice.paidTotal")}</dt>
                <dd className="tabular text-positive">{money(invoice.paidTotal)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{t("invoice.remaining")}</dt>
                <dd className="tabular">{money(remaining)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={t("common.status")}>
            <div className="space-y-3 text-sm">
              <Badge tone={INVOICE_TONE[invoice.status] ?? "neutral"}>
                {t(`invoice.status.${invoice.status}` as MessageKey)}
              </Badge>
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("common.client")}</dt>
                  <dd className="text-right">
                    <Link
                      href={`/admin/clients/${invoice.client.id}`}
                      className="text-navy hover:underline"
                    >
                      {invoice.client.name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("common.date")}</dt>
                  <dd>{date(invoice.issuedAt ?? invoice.createdAt)}</dd>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("invoice.dueDate")}</dt>
                    <dd>{date(invoice.dueDate)}</dd>
                  </div>
                )}
              </dl>
              {invoice.notes && (
                <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted">
                  {invoice.notes}
                </p>
              )}
            </div>
          </Card>

          <Card title={t("payment.title")} bodyClassName="p-5 pt-3">
            {invoice.payments.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-line text-sm">
                {invoice.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className={`flex items-center justify-between gap-3 py-2.5 ${payment.cancelled ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className={payment.cancelled ? "line-through" : "font-medium"}>
                        {money(payment.amount)}
                      </p>
                      <p className="text-xs text-muted">
                        {date(payment.receivedAt)} ·{" "}
                        {t(`payment.method.${payment.method}` as MessageKey)}
                      </p>
                    </div>
                    {payment.receiptId && (
                      <Link
                        href={`/admin/receipts/${payment.receiptId}`}
                        className="tabular shrink-0 text-xs text-info hover:underline"
                      >
                        {payment.receiptNumber}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Add a line */}
      <Modal
        open={addingLine}
        title={t("invoice.addLine")}
        onClose={() => {
          setAddingLine(false);
          line.clearError();
        }}
      >
        <form action={line.run} className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <ErrorNote>{line.error}</ErrorNote>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={freeForm}
              onChange={(e) => setFreeForm(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            {t("common.description")} · {t("common.optional")}
          </label>

          {freeForm ? (
            <>
              <Field label={`${t("common.department")} *`}>
                <Select name="departmentId" required defaultValue="">
                  <option value="" disabled>—</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {n(dept)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`${t("common.description")} *`}>
                <Input name="description" required />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="taxable"
                  defaultChecked
                  className="h-4 w-4 rounded border-line"
                />
                {t("common.tax")}
              </label>
            </>
          ) : (
            <Field label={`${t("common.description")} *`}>
              <Select name="serviceItemId" required defaultValue="">
                <option value="" disabled>—</option>
                {serviceItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {n(item)} · {money(item.unitPrice)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("common.quantity")}>
              <Input name="quantity" type="number" min={0.01} step={0.01} defaultValue={1} />
            </Field>
            <Field label={`${t("common.unitPrice")} (FCFA)`} hint={t("common.optional")}>
              <Input name="unitPrice" type="number" min={0} step={100} />
            </Field>
            <Field label={t("common.date")}>
              <Input name="occurredAt" type="date" defaultValue={today} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddingLine(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={line.pending}>
              {line.pending ? t("common.saving") : t("common.add")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue */}
      <Modal
        open={issuing}
        title={t("invoice.issue")}
        onClose={() => {
          setIssuing(false);
          issue.clearError();
        }}
      >
        <form action={issue.run} className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <ErrorNote>{issue.error}</ErrorNote>
          <p className="text-sm text-muted">
            {t("common.total")} : <strong className="text-foreground">{money(invoice.total)}</strong>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.date")} *`}>
              <Input name="issuedAt" type="date" required defaultValue={today} />
            </Field>
            <Field label={t("invoice.dueDate")}>
              <Input name="dueDate" type="date" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIssuing(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="gold" disabled={issue.pending}>
              {issue.pending ? t("common.saving") : t("invoice.issue")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Collect */}
      <Modal
        open={paying}
        title={t("payment.new")}
        onClose={() => {
          setPaying(false);
          pay.clearError();
        }}
      >
        <form action={pay.run} className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <ErrorNote>{pay.error}</ErrorNote>
          <p className="text-sm text-muted">
            {t("invoice.remaining")} :{" "}
            <strong className="text-foreground">{money(remaining)}</strong>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.amount")} (FCFA) *`}>
              <Input
                name="amount"
                type="number"
                min={1}
                max={remaining}
                required
                defaultValue={remaining}
              />
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
            <Button type="button" variant="secondary" onClick={() => setPaying(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pay.pending}>
              {pay.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

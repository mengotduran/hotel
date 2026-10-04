"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { createInvoice } from "@/lib/actions/invoices";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, PageHeader, Select,
  StatTile, Table, Td, Th, Textarea, type BadgeTone,
} from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { IconPlus } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export const INVOICE_TONE: Record<string, BadgeTone> = {
  OPEN: "neutral",
  ISSUED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "positive",
  CANCELLED: "negative",
};

export interface InvoiceRow {
  id: string;
  number: string;
  clientName: string;
  clientId: string;
  status: string;
  issuedAt: string | null;
  createdAt: string;
  total: number;
  paidTotal: number;
  lineCount: number;
}

const STATUSES = ["OPEN", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"];

export function InvoicesView({
  invoices,
  clients,
}: {
  invoices: InvoiceRow[];
  clients: { id: string; name: string; code: string }[];
}) {
  const { t, money, date } = useI18n();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("");
  const create = useAction(createInvoice, {
    onSuccess: (data) => {
      setCreating(false);
      if (data?.id) router.push(`/admin/invoices/${data.id}`);
    },
  });

  const visible = filter ? invoices.filter((i) => i.status === filter) : invoices;
  const { page, setPage, totalPages, pageRows } = usePagination(visible, 25);
  const outstanding = invoices
    .filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_PAID")
    .reduce((sum, i) => sum + (i.total - i.paidTotal), 0);
  const openFolios = invoices.filter((i) => i.status === "OPEN").length;

  return (
    <>
      <PageHeader
        title={t("invoice.title")}
        subtitle={t("invoice.subtitle")}
        actions={
          <>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-auto"
              aria-label={t("common.status")}
            >
              <option value="">{t("common.all")}</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`invoice.status.${status}` as MessageKey)}
                </option>
              ))}
            </Select>
            <Button variant="gold" onClick={() => setCreating(true)}>
              <IconPlus className="h-4 w-4" />
              {t("invoice.new")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("invoice.status.OPEN")} value={String(openFolios)} />
        <StatTile label={t("invoice.remaining")} value={money(outstanding)} tone="negative" />
        <StatTile label={t("common.total")} value={String(invoices.length)} />
      </div>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {visible.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("invoice.number")}</Th>
                  <Th>{t("common.client")}</Th>
                  <Th>{t("common.date")}</Th>
                  <Th align="center">{t("invoice.lines")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("common.total")}</Th>
                  <Th align="right">{t("invoice.remaining")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((invoice) => (
                  <tr key={invoice.id}>
                    <Td>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="tabular font-medium text-navy hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/clients/${invoice.clientId}`}
                        className="hover:underline"
                      >
                        {invoice.clientName}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {date(invoice.issuedAt ?? invoice.createdAt)}
                    </Td>
                    <Td align="center" className="tabular text-muted">
                      {invoice.lineCount}
                    </Td>
                    <Td>
                      <Badge tone={INVOICE_TONE[invoice.status] ?? "neutral"}>
                        {t(`invoice.status.${invoice.status}` as MessageKey)}
                      </Badge>
                    </Td>
                    <Td align="right" className="font-medium">{money(invoice.total)}</Td>
                    <Td align="right">
                      {invoice.status === "PAID" || invoice.status === "CANCELLED" ? (
                        <span className="text-muted">—</span>
                      ) : (
                        money(invoice.total - invoice.paidTotal)
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
        title={t("invoice.new")}
        onClose={() => {
          setCreating(false);
          create.clearError();
        }}
      >
        <form action={create.run} className="space-y-4">
          <ErrorNote>{create.error}</ErrorNote>
          <Field label={`${t("common.client")} *`}>
            <Select name="clientId" required defaultValue="">
              <option value="" disabled>
                {t("common.search")}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("common.notes")}>
            <Textarea name="notes" rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={create.pending}>
              {create.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

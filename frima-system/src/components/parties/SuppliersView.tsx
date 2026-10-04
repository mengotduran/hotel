"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { saveSupplier } from "@/lib/actions/directory";
import { settleExpense } from "@/lib/actions/treasury";
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

export interface SupplierRow {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  purchases: number;
  payable: number;
}

export interface OpenPayable {
  id: string;
  reference: string;
  supplierName: string;
  description: string;
  total: number;
  incurredAt: string;
}

export function SuppliersView({
  suppliers,
  payables,
}: {
  suppliers: SupplierRow[];
  payables: OpenPayable[];
}) {
  const { t, money, date } = useI18n();
  const [creating, setCreating] = useState(false);

  const save = useAction(saveSupplier, { onSuccess: () => setCreating(false) });
  const settle = useAction(settleExpense);

  const totalPayable = suppliers.reduce((sum, s) => sum + s.payable, 0);
  const totalPurchases = suppliers.reduce((sum, s) => sum + s.purchases, 0);
  const { page, setPage, totalPages, pageRows } = usePagination(suppliers, 25);

  return (
    <>
      <PageHeader
        title={t("supplier.title")}
        subtitle={t("supplier.subtitle")}
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" />
            {t("supplier.new")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label={t("expense.title")} value={money(totalPurchases)} />
        <StatTile
          label={t("dash.suppliersPayable")}
          value={money(totalPayable)}
          tone={totalPayable > 0 ? "negative" : "positive"}
        />
      </div>

      <ErrorNote>{settle.error}</ErrorNote>

      {payables.length > 0 && (
        <div className="mt-6">
          <Card title={t("expense.unpaid")} bodyClassName="p-5 pt-3">
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("common.supplier")}</Th>
                  <Th>{t("common.description")}</Th>
                  <Th>{t("common.date")}</Th>
                  <Th align="right">{t("common.total")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {payables.map((payable) => (
                  <tr key={payable.id}>
                    <Td className="tabular text-xs text-muted">{payable.reference}</Td>
                    <Td className="font-medium">{payable.supplierName}</Td>
                    <Td>{payable.description}</Td>
                    <Td className="whitespace-nowrap text-muted">{date(payable.incurredAt)}</Td>
                    <Td align="right" className="font-medium">{money(payable.total)}</Td>
                    <Td align="right">
                      <Select
                        defaultValue=""
                        disabled={settle.pending}
                        onChange={(e) => {
                          if (e.target.value) settle.run(payable.id, e.target.value);
                        }}
                        className="w-auto py-1 text-xs"
                        aria-label={t("expense.paid")}
                      >
                        <option value="">{t("expense.paid")}…</option>
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {t(`payment.method.${method}` as MessageKey)}
                          </option>
                        ))}
                      </Select>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Card bodyClassName="p-5 pt-3">
          {suppliers.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.code")}</Th>
                  <Th>{t("common.name")}</Th>
                  <Th>{t("common.phone")}</Th>
                  <Th>{t("common.email")}</Th>
                  <Th align="right">{t("expense.title")}</Th>
                  <Th align="right">{t("common.balance")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((supplier) => (
                  <tr key={supplier.id}>
                    <Td className="tabular text-xs text-muted">{supplier.code}</Td>
                    <Td className="font-medium">{supplier.name}</Td>
                    <Td className="text-muted">{supplier.phone ?? "—"}</Td>
                    <Td className="text-muted">{supplier.email ?? "—"}</Td>
                    <Td align="right">{money(supplier.purchases)}</Td>
                    <Td align="right">
                      {supplier.payable > 0 ? (
                        <Badge tone="negative">{money(supplier.payable)}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
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
        title={t("supplier.new")}
        onClose={() => {
          setCreating(false);
          save.clearError();
        }}
      >
        <form action={save.run} className="space-y-4">
          <ErrorNote>{save.error}</ErrorNote>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.name")} *`} className="sm:col-span-2">
              <Input name="name" required />
            </Field>
            <Field label={t("common.phone")}>
              <Input name="phone" />
            </Field>
            <Field label={t("common.email")}>
              <Input name="email" type="email" />
            </Field>
            <Field label={t("common.address")} className="sm:col-span-2">
              <Input name="address" />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.pending}>
              {save.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

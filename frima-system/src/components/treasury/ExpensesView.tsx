"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cancelExpense, recordExpense } from "@/lib/actions/treasury";
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

export interface ExpenseRow {
  id: string;
  reference: string;
  description: string;
  categoryCode: string;
  categoryName: { fr: string; en: string };
  departmentName: { fr: string; en: string } | null;
  supplierName: string | null;
  amount: number;
  taxAmount: number;
  total: number;
  method: string;
  paid: boolean;
  cancelled: boolean;
  incurredAt: string;
}

export function ExpensesView({
  expenses,
  categories,
  departments,
  suppliers,
  accounts,
  today,
  totals,
}: {
  expenses: ExpenseRow[];
  categories: { id: string; code: string; nameFr: string; nameEn: string; expenseAccount: string }[];
  departments: { id: string; nameFr: string; nameEn: string }[];
  suppliers: { id: string; name: string; code: string }[];
  accounts: { code: string; nameFr: string; nameEn: string }[];
  today: string;
  totals: { month: number; unpaid: number };
}) {
  const { t, n, locale, money, date } = useI18n();
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<ExpenseRow | null>(null);
  const [reason, setReason] = useState("");
  const { page, setPage, totalPages, pageRows } = usePagination(expenses, 25);
  const [paid, setPaid] = useState(true);

  const record = useAction(recordExpense, { onSuccess: () => setCreating(false) });
  const drop = useAction(cancelExpense, {
    onSuccess: () => {
      setCancelling(null);
      setReason("");
    },
  });

  return (
    <>
      <PageHeader
        title={t("expense.title")}
        subtitle={t("expense.subtitle")}
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" />
            {t("expense.new")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label={t("common.period")} value={money(totals.month)} tone="negative" />
        <StatTile
          label={t("expense.unpaid")}
          value={money(totals.unpaid)}
          tone={totals.unpaid > 0 ? "warning" : "neutral"}
        />
      </div>

      <ErrorNote>{drop.error}</ErrorNote>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {expenses.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("common.description")}</Th>
                  <Th>{t("common.category")}</Th>
                  <Th>{t("common.department")}</Th>
                  <Th align="right">{t("common.total")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((expense) => (
                  <tr key={expense.id} className={expense.cancelled ? "opacity-50" : ""}>
                    <Td className="whitespace-nowrap text-muted">{date(expense.incurredAt)}</Td>
                    <Td className="tabular text-xs text-muted">{expense.reference}</Td>
                    <Td>
                      <span className="block max-w-[28ch] truncate">{expense.description}</span>
                      {expense.supplierName && (
                        <span className="text-xs text-muted">{expense.supplierName}</span>
                      )}
                    </Td>
                    <Td className="text-xs text-muted">
                      {t(`expense.cat.${expense.categoryCode}` as MessageKey)}
                    </Td>
                    <Td className="text-xs text-muted">
                      {expense.departmentName
                        ? locale === "fr"
                          ? expense.departmentName.fr
                          : expense.departmentName.en
                        : "—"}
                    </Td>
                    <Td
                      align="right"
                      className={expense.cancelled ? "line-through" : "font-medium"}
                    >
                      {money(expense.total)}
                    </Td>
                    <Td>
                      {expense.cancelled ? (
                        <Badge tone="negative">{t("payment.cancelled")}</Badge>
                      ) : expense.paid ? (
                        <Badge tone="positive">{t("expense.paid")}</Badge>
                      ) : (
                        <Badge tone="warning">{t("expense.unpaid")}</Badge>
                      )}
                    </Td>
                    <Td align="right">
                      {!expense.cancelled && (
                        <Button
                          variant="ghost"
                          onClick={() => setCancelling(expense)}
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
        title={t("expense.new")}
        onClose={() => {
          setCreating(false);
          record.clearError();
        }}
        wide
      >
        <form action={record.run} className="space-y-4">
          <ErrorNote>{record.error}</ErrorNote>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.category")} *`}>
              <Select name="categoryId" required defaultValue="">
                <option value="" disabled>—</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {t(`expense.cat.${category.code}` as MessageKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("acct.account")}
              hint={`${t("common.optional")} · ${t("acct.chartOfAccounts")}`}
            >
              <Select name="expenseAccount" defaultValue="">
                <option value="">—</option>
                {accounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} · {n(account)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`${t("common.description")} *`} className="sm:col-span-2">
              <Input name="description" required />
            </Field>
            <Field label={t("common.department")} hint={t("acct.analyticalSubtitle")}>
              <Select name="departmentId" defaultValue="">
                <option value="">—</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {n(dept)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.supplier")}>
              <Select name="supplierId" defaultValue="">
                <option value="">—</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`${t("common.amount")} (FCFA) *`} hint={t("common.subtotal")}>
              <Input name="amount" type="number" min={1} required />
            </Field>
            <Field label={`${t("common.tax")} (FCFA)`} hint={t("common.optional")}>
              <Input name="taxAmount" type="number" min={0} defaultValue={0} />
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
            <Field label={t("expense.incurredAt")}>
              <Input name="incurredAt" type="date" defaultValue={today} />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="paid"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            {t("expense.paid")}
            {!paid && (
              <span className="text-xs text-muted">· {t("common.supplier")} {t("common.required")}</span>
            )}
          </label>

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
        title={`${t("common.cancel")} · ${cancelling?.reference ?? ""}`}
        onClose={() => {
          setCancelling(null);
          drop.clearError();
        }}
      >
        <div className="space-y-4">
          <ErrorNote>{drop.error}</ErrorNote>
          <p className="text-sm text-muted">
            {cancelling?.description} · {money(cancelling?.total ?? 0)}
          </p>
          <Field label={`${t("common.notes")} *`}>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
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

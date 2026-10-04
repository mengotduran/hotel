"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import {
  Card, EmptyState, PageHeader, Select, StatTile, Table, Td, Th,
} from "@/components/ui/Kit";

export interface LedgerRow {
  id: string;
  entryNumber: string;
  journal: string;
  date: string;
  label: string;
  lineLabel: string;
  departmentName: { fr: string; en: string } | null;
  debit: number;
  credit: number;
  balance: number;
}

function AccountPicker({
  value,
  accounts,
}: {
  value: string;
  accounts: { code: string; nameFr: string; nameEn: string }[];
}) {
  const { t, n } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Select
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("account", e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="w-auto max-w-xs"
      aria-label={t("acct.account")}
    >
      {accounts.map((account) => (
        <option key={account.code} value={account.code}>
          {account.code} · {n(account)}
        </option>
      ))}
    </Select>
  );
}

export function LedgerView({
  rows,
  accounts,
  account,
  period,
  openingBalance,
  closingBalance,
}: {
  rows: LedgerRow[];
  accounts: { code: string; nameFr: string; nameEn: string }[];
  account: { code: string; nameFr: string; nameEn: string } | null;
  period: { from: string; to: string };
  openingBalance: number;
  closingBalance: number;
}) {
  const { t, n, locale, money, date } = useI18n();

  const movements = rows.reduce(
    (acc, row) => ({ debit: acc.debit + row.debit, credit: acc.credit + row.credit }),
    { debit: 0, credit: 0 },
  );

  return (
    <>
      <PageHeader
        title={t("acct.ledger")}
        subtitle={account ? `${account.code} · ${n(account)}` : t("acct.ledgerSubtitle")}
        actions={
          <Suspense fallback={null}>
            <AccountPicker value={account?.code ?? ""} accounts={accounts} />
            <PeriodPicker from={period.from} to={period.to} />
          </Suspense>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("acct.openingBalance")} value={money(openingBalance)} />
        <StatTile label={t("acct.debit")} value={money(movements.debit)} />
        <StatTile label={t("acct.credit")} value={money(movements.credit)} />
        <StatTile
          label={t("acct.closingBalance")}
          value={money(closingBalance)}
          tone={closingBalance >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("acct.entryNumber")}</Th>
                  <Th>{t("acct.label")}</Th>
                  <Th>{t("common.department")}</Th>
                  <Th align="right">{t("acct.debit")}</Th>
                  <Th align="right">{t("acct.credit")}</Th>
                  <Th align="right">{t("common.balance")}</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td colSpan={6} className="text-xs font-medium text-muted">
                    {t("acct.openingBalance")}
                  </Td>
                  <Td align="right" className="font-medium">{money(openingBalance)}</Td>
                </tr>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <Td className="whitespace-nowrap text-muted">{date(row.date)}</Td>
                    <Td className="tabular text-xs">
                      {row.entryNumber}
                      <span className="ml-1.5 text-muted">{row.journal}</span>
                    </Td>
                    <Td>
                      <span className="block max-w-[32ch] truncate">{row.label}</span>
                      <span className="text-xs text-muted">{row.lineLabel}</span>
                    </Td>
                    <Td className="text-xs text-muted">
                      {row.departmentName
                        ? locale === "fr"
                          ? row.departmentName.fr
                          : row.departmentName.en
                        : "—"}
                    </Td>
                    <Td align="right">{row.debit > 0 ? money(row.debit) : ""}</Td>
                    <Td align="right">{row.credit > 0 ? money(row.credit) : ""}</Td>
                    <Td align="right" className="font-medium">{money(row.balance)}</Td>
                  </tr>
                ))}
                <tr>
                  <Td colSpan={4} className="font-semibold">{t("acct.closingBalance")}</Td>
                  <Td align="right" className="font-semibold">{money(movements.debit)}</Td>
                  <Td align="right" className="font-semibold">{money(movements.credit)}</Td>
                  <Td align="right" className="font-semibold text-navy">
                    {money(closingBalance)}
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

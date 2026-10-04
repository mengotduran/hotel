"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import {
  Badge, Card, EmptyState, PageHeader, Select, StatTile, Table, Td, Th,
} from "@/components/ui/Kit";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface JournalEntryRow {
  id: string;
  number: string;
  journal: string;
  date: string;
  label: string;
  isReversal: boolean;
  lines: {
    id: string;
    accountCode: string;
    accountName: { fr: string; en: string };
    departmentName: { fr: string; en: string } | null;
    label: string;
    debit: number;
    credit: number;
  }[];
}

const JOURNALS = ["VT", "AC", "CA", "BQ", "OD"];

function JournalFilter({ value }: { value: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Select
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value) next.set("journal", e.target.value);
        else next.delete("journal");
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="w-auto"
      aria-label={t("acct.journalCode")}
    >
      <option value="">{t("common.all")}</option>
      {JOURNALS.map((code) => (
        <option key={code} value={code}>
          {code} · {t(`acct.journal.${code}` as MessageKey)}
        </option>
      ))}
    </Select>
  );
}

export function JournalView({
  entries,
  period,
  journal,
  totals,
}: {
  entries: JournalEntryRow[];
  period: { from: string; to: string };
  journal: string;
  totals: { debit: number; credit: number };
}) {
  const { t, locale, money, date } = useI18n();
  const balanced = totals.debit === totals.credit;

  return (
    <>
      <PageHeader
        title={t("acct.journal")}
        subtitle={t("acct.journalSubtitle")}
        actions={
          <Suspense fallback={null}>
            <JournalFilter value={journal} />
            <PeriodPicker from={period.from} to={period.to} />
          </Suspense>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("acct.debit")} value={money(totals.debit)} />
        <StatTile label={t("acct.credit")} value={money(totals.credit)} />
        <StatTile
          label={balanced ? t("acct.balanced") : t("acct.unbalanced")}
          value={money(totals.debit - totals.credit)}
          tone={balanced ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6 space-y-3">
        {entries.length === 0 ? (
          <Card>
            <EmptyState />
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} bodyClassName="p-4 pt-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2.5">
                  <span className="tabular text-sm font-semibold text-navy">
                    {entry.number}
                  </span>
                  <Badge tone="info">
                    {entry.journal} · {t(`acct.journal.${entry.journal}` as MessageKey)}
                  </Badge>
                  {entry.isReversal && (
                    <Badge tone="negative">{t("payment.cancelled")}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted">{date(entry.date)}</span>
              </div>
              <p className="mb-2 text-sm text-foreground">{entry.label}</p>

              <Table>
                <thead>
                  <tr>
                    <Th>{t("acct.accountCode")}</Th>
                    <Th>{t("acct.account")}</Th>
                    <Th>{t("common.department")}</Th>
                    <Th align="right">{t("acct.debit")}</Th>
                    <Th align="right">{t("acct.credit")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines.map((line) => (
                    <tr key={line.id}>
                      <Td className="tabular font-medium">{line.accountCode}</Td>
                      <Td>
                        <span className="block">
                          {locale === "fr" ? line.accountName.fr : line.accountName.en}
                        </span>
                        <span className="text-xs text-muted">{line.label}</span>
                      </Td>
                      <Td className="text-xs text-muted">
                        {line.departmentName
                          ? locale === "fr"
                            ? line.departmentName.fr
                            : line.departmentName.en
                          : "—"}
                      </Td>
                      <Td align="right">{line.debit > 0 ? money(line.debit) : ""}</Td>
                      <Td align="right">{line.credit > 0 ? money(line.credit) : ""}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

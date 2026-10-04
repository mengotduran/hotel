import { prisma } from "@/lib/prisma";
import { ledgerForAccount } from "@/lib/accounting/reports";
import { monthBounds, parsePeriod, toInputDate } from "@/lib/reporting";
import { LedgerView, type LedgerRow } from "@/components/accounting/LedgerView";

export const dynamic = "force-dynamic";

export default async function LedgerPage(props: PageProps<"/admin/accounting/ledger">) {
  const search = await props.searchParams;
  const period = parsePeriod(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
    monthBounds(new Date()),
  );

  // Default to whichever account has actually moved, so the page is never
  // an empty shell on first open.
  const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
  const used = await prisma.journalLine.groupBy({ by: ["accountCode"] });
  const fallback =
    accounts.find((a) => used.some((u) => u.accountCode === a.code))?.code ??
    accounts[0]?.code ??
    "411";
  const code = typeof search.account === "string" ? search.account : fallback;

  const ledger = await ledgerForAccount(code, period);

  const rows: LedgerRow[] = ledger.rows.map(({ line, balance }) => ({
    id: line.id,
    entryNumber: line.entry.number,
    journal: line.entry.journal,
    date: line.entry.date.toISOString(),
    label: line.entry.label,
    lineLabel: line.label,
    departmentName: line.department
      ? { fr: line.department.nameFr, en: line.department.nameEn }
      : null,
    debit: line.debit,
    credit: line.credit,
    balance,
  }));

  return (
    <LedgerView
      rows={rows}
      accounts={accounts.map((a) => ({ code: a.code, nameFr: a.nameFr, nameEn: a.nameEn }))}
      account={
        ledger.account
          ? {
              code: ledger.account.code,
              nameFr: ledger.account.nameFr,
              nameEn: ledger.account.nameEn,
            }
          : null
      }
      period={{ from: toInputDate(period.from), to: toInputDate(period.to) }}
      openingBalance={ledger.openingBalance}
      closingBalance={ledger.closingBalance}
    />
  );
}

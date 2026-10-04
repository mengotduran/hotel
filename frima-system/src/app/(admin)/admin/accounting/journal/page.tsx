import { journalEntries } from "@/lib/accounting/reports";
import { monthBounds, parsePeriod, toInputDate } from "@/lib/reporting";
import { JournalView, type JournalEntryRow } from "@/components/accounting/JournalView";

export const dynamic = "force-dynamic";

export default async function JournalPage(props: PageProps<"/admin/accounting/journal">) {
  const search = await props.searchParams;
  const period = parsePeriod(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
    monthBounds(new Date()),
  );
  const journal = typeof search.journal === "string" ? search.journal : "";

  const entries = await journalEntries(period, journal || undefined);

  const rows: JournalEntryRow[] = entries.map((entry) => ({
    id: entry.id,
    number: entry.number,
    journal: entry.journal,
    date: entry.date.toISOString(),
    label: entry.label,
    isReversal: entry.reversalOf !== null,
    lines: entry.lines.map((line) => ({
      id: line.id,
      accountCode: line.accountCode,
      accountName: { fr: line.account.nameFr, en: line.account.nameEn },
      departmentName: line.department
        ? { fr: line.department.nameFr, en: line.department.nameEn }
        : null,
      label: line.label,
      debit: line.debit,
      credit: line.credit,
    })),
  }));

  const totals = rows.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.lines.reduce((s, l) => s + l.debit, 0),
      credit: acc.credit + entry.lines.reduce((s, l) => s + l.credit, 0),
    }),
    { debit: 0, credit: 0 },
  );

  return (
    <JournalView
      entries={rows}
      period={{ from: toInputDate(period.from), to: toInputDate(period.to) }}
      journal={journal}
      totals={totals}
    />
  );
}

import { trialBalance } from "@/lib/accounting/reports";
import { getSettings, monthBounds, parsePeriod, toInputDate } from "@/lib/reporting";
import { TrialBalanceView, type TrialBalanceRow } from "@/components/accounting/TrialBalanceView";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage(
  props: PageProps<"/admin/accounting/trial-balance">,
) {
  const search = await props.searchParams;
  const period = parsePeriod(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
    monthBounds(new Date()),
  );

  const [balance, settings] = await Promise.all([trialBalance(period), getSettings()]);

  const rows: TrialBalanceRow[] = balance.rows.map((row) => ({
    code: row.account.code,
    nameFr: row.account.nameFr,
    nameEn: row.account.nameEn,
    klass: row.account.klass,
    debit: row.debit,
    credit: row.credit,
    debitBalance: row.debitBalance,
    creditBalance: row.creditBalance,
  }));

  return (
    <TrialBalanceView
      rows={rows}
      totals={balance.totals}
      period={{ from: toInputDate(period.from), to: toInputDate(period.to) }}
      hotelName={settings["hotel.name"] ?? "FRIMA Guest Suites"}
    />
  );
}

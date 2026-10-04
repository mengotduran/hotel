import { analyticalStatement } from "@/lib/accounting/reports";
import { getSettings, monthBounds, parsePeriod, toInputDate } from "@/lib/reporting";
import {
  AnalyticalView, type AnalyticalColumn, type AnalyticalRow,
} from "@/components/accounting/AnalyticalView";

export const dynamic = "force-dynamic";

export default async function AnalyticalPage(
  props: PageProps<"/admin/accounting/analytical">,
) {
  const search = await props.searchParams;
  const period = parsePeriod(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
    monthBounds(new Date()),
  );

  const [statement, settings] = await Promise.all([
    analyticalStatement(period),
    getSettings(),
  ]);

  const columns: AnalyticalColumn[] = statement.columns.map((column) =>
    column.dept
      ? {
          id: column.dept.id,
          nameFr: column.dept.nameFr,
          nameEn: column.dept.nameEn,
          colour: column.dept.colour,
        }
      : {
          id: null,
          nameFr: "Non affecté",
          nameEn: "Unallocated",
          colour: "#9aa4b2",
        },
  );

  const toRows = (
    rows: { account: { code: string; nameFr: string; nameEn: string }; cells: number[]; total: number }[],
  ): AnalyticalRow[] =>
    rows.map((row) => ({
      code: row.account.code,
      nameFr: row.account.nameFr,
      nameEn: row.account.nameEn,
      cells: row.cells,
      total: row.total,
    }));

  return (
    <AnalyticalView
      columns={columns}
      revenue={toRows(statement.revenue)}
      expenses={toRows(statement.expenses)}
      revenueTotals={statement.revenueTotals}
      expenseTotals={statement.expenseTotals}
      resultTotals={statement.resultTotals}
      period={{ from: toInputDate(period.from), to: toInputDate(period.to) }}
      hotelName={settings["hotel.name"] ?? "FRIMA Guest Suites"}
    />
  );
}

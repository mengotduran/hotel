import { prisma } from "@/lib/prisma";
import type { Period } from "@/lib/reporting";

/** Entries as an accountant reads them: chronological, each with its lines. */
export async function journalEntries(period: Period, journal?: string) {
  return prisma.journalEntry.findMany({
    where: {
      date: { gte: period.from, lte: period.to },
      ...(journal ? { journal } : {}),
    },
    orderBy: [{ date: "asc" }, { number: "asc" }],
    include: {
      lines: {
        include: {
          account: { select: { nameFr: true, nameEn: true } },
          department: { select: { nameFr: true, nameEn: true, colour: true } },
        },
      },
    },
    take: 500,
  });
}

/** Movements on one account, with a running balance. */
export async function ledgerForAccount(code: string, period: Period) {
  const [account, opening, lines] = await Promise.all([
    prisma.account.findUnique({ where: { code } }),
    prisma.journalLine.aggregate({
      where: { accountCode: code, entry: { date: { lt: period.from } } },
      _sum: { debit: true, credit: true },
    }),
    prisma.journalLine.findMany({
      where: {
        accountCode: code,
        entry: { date: { gte: period.from, lte: period.to } },
      },
      orderBy: [{ entry: { date: "asc" } }, { entry: { number: "asc" } }],
      include: {
        entry: { select: { number: true, date: true, label: true, journal: true } },
        department: { select: { nameFr: true, nameEn: true } },
      },
      take: 500,
    }),
  ]);

  const openingBalance = (opening._sum.debit ?? 0) - (opening._sum.credit ?? 0);
  let running = openingBalance;
  const rows = lines.map((line) => {
    running += line.debit - line.credit;
    return { line, balance: running };
  });

  return { account, openingBalance, rows, closingBalance: running };
}

/** Totals and balances per account · the trial balance proper. */
export async function trialBalance(period: Period) {
  const [grouped, accounts] = await Promise.all([
    prisma.journalLine.groupBy({
      by: ["accountCode"],
      where: { entry: { date: { gte: period.from, lte: period.to } } },
      _sum: { debit: true, credit: true },
    }),
    prisma.account.findMany({ orderBy: { code: "asc" } }),
  ]);

  const rows = accounts
    .map((account) => {
      const row = grouped.find((g) => g.accountCode === account.code);
      const debit = row?._sum.debit ?? 0;
      const credit = row?._sum.credit ?? 0;
      const balance = debit - credit;
      return {
        account,
        debit,
        credit,
        debitBalance: balance > 0 ? balance : 0,
        creditBalance: balance < 0 ? -balance : 0,
      };
    })
    .filter((row) => row.debit !== 0 || row.credit !== 0);

  const totals = rows.reduce(
    (acc, row) => ({
      debit: acc.debit + row.debit,
      credit: acc.credit + row.credit,
      debitBalance: acc.debitBalance + row.debitBalance,
      creditBalance: acc.creditBalance + row.creditBalance,
    }),
    { debit: 0, credit: 0, debitBalance: 0, creditBalance: 0 },
  );

  return { rows, totals };
}

/**
 * The analytical angle: every class 6 and class 7 account, broken down by the
 * department that carried it, plus whatever could not be allocated.
 */
export async function analyticalStatement(period: Period) {
  const [departments, grouped, accounts] = await Promise.all([
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.journalLine.groupBy({
      by: ["departmentId", "accountCode"],
      where: {
        entry: { date: { gte: period.from, lte: period.to } },
        account: { klass: { in: [6, 7] } },
      },
      _sum: { debit: true, credit: true },
    }),
    prisma.account.findMany({
      where: { klass: { in: [6, 7] } },
      orderBy: { code: "asc" },
    }),
  ]);

  const columns = [
    ...departments.map((dept) => ({ id: dept.id, dept })),
    { id: null as string | null, dept: null },
  ];

  const buildRows = (klass: number) =>
    accounts
      .filter((account) => account.klass === klass)
      .map((account) => {
        const cells = columns.map((column) => {
          const row = grouped.find(
            (g) => g.accountCode === account.code && g.departmentId === column.id,
          );
          const debit = row?._sum.debit ?? 0;
          const credit = row?._sum.credit ?? 0;
          // Expenses are naturally debit, revenue naturally credit.
          return klass === 6 ? debit - credit : credit - debit;
        });
        return { account, cells, total: cells.reduce((a, b) => a + b, 0) };
      })
      .filter((row) => row.total !== 0);

  const revenue = buildRows(7);
  const expenses = buildRows(6);

  const sumCells = (rows: { cells: number[] }[]) =>
    columns.map((_, index) => rows.reduce((sum, row) => sum + row.cells[index], 0));

  const revenueTotals = sumCells(revenue);
  const expenseTotals = sumCells(expenses);
  const resultTotals = revenueTotals.map((value, index) => value - expenseTotals[index]);

  return { columns, revenue, expenses, revenueTotals, expenseTotals, resultTotals };
}

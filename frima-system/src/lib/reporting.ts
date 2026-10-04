import { prisma } from "@/lib/prisma";
import { ACC } from "@/lib/accounting/chart";

export interface Period {
  from: Date;
  to: Date;
}

/** Inclusive day bounds · SQLite stores timestamps, so compare against them. */
export function dayBounds(date: Date): Period {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function monthBounds(date: Date): Period {
  const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

/** Rolling window ending today · the useful default for an operations view,
 *  where a calendar month shows almost nothing on the 2nd or 3rd. */
export function rollingDays(days: number, end = new Date()): Period {
  const to = new Date(end);
  to.setHours(23, 59, 59, 999);
  const from = new Date(end);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function parsePeriod(
  fromParam?: string,
  toParam?: string,
  fallback: Period = monthBounds(new Date()),
): Period {
  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : fallback.from;
  const to = toParam ? new Date(`${toParam}T23:59:59.999`) : fallback.to;
  return {
    from: Number.isNaN(from.getTime()) ? fallback.from : from,
    to: Number.isNaN(to.getTime()) ? fallback.to : to,
  };
}

export function toInputDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ---------------------------------------------------------------------------
// Figures derived from the journal, so the dashboard always ties to the books
// ---------------------------------------------------------------------------

/** Revenue recognised in the period, by department (class 7 accounts). */
export async function revenueByDepartment(period: Period) {
  const rows = await prisma.journalLine.groupBy({
    by: ["departmentId"],
    where: {
      account: { klass: 7 },
      entry: { date: { gte: period.from, lte: period.to } },
    },
    _sum: { credit: true, debit: true },
  });

  const departments = await prisma.department.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return departments
    .map((dept) => {
      const row = rows.find((r) => r.departmentId === dept.id);
      const amount = (row?._sum.credit ?? 0) - (row?._sum.debit ?? 0);
      return { department: dept, amount };
    })
    .filter((entry) => entry.amount !== 0 || entry.department.code !== "GEN");
}

/** Direct costs charged to each department (class 6 accounts). */
export async function expensesByDepartment(period: Period) {
  const rows = await prisma.journalLine.groupBy({
    by: ["departmentId"],
    where: {
      account: { klass: 6 },
      entry: { date: { gte: period.from, lte: period.to } },
    },
    _sum: { credit: true, debit: true },
  });

  const departments = await prisma.department.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const unallocatedRow = rows.find((r) => r.departmentId === null);
  const unallocated =
    (unallocatedRow?._sum.debit ?? 0) - (unallocatedRow?._sum.credit ?? 0);

  return {
    byDepartment: departments.map((dept) => {
      const row = rows.find((r) => r.departmentId === dept.id);
      const amount = (row?._sum.debit ?? 0) - (row?._sum.credit ?? 0);
      return { department: dept, amount };
    }),
    unallocated,
  };
}

export async function expensesByCategory(period: Period) {
  const rows = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      cancelled: false,
      incurredAt: { gte: period.from, lte: period.to },
    },
    _sum: { amount: true },
  });

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((category) => ({
    category,
    amount: rows.find((r) => r.categoryId === category.id)?._sum.amount ?? 0,
  }));
}

/** Totals of class 6 and class 7 movements · the profit-and-loss headline. */
export async function profitAndLoss(period: Period) {
  const [revenueRows, expenseRows] = await Promise.all([
    prisma.journalLine.aggregate({
      where: {
        account: { klass: 7 },
        entry: { date: { gte: period.from, lte: period.to } },
      },
      _sum: { credit: true, debit: true },
    }),
    prisma.journalLine.aggregate({
      where: {
        account: { klass: 6 },
        entry: { date: { gte: period.from, lte: period.to } },
      },
      _sum: { credit: true, debit: true },
    }),
  ]);

  const revenue =
    (revenueRows._sum.credit ?? 0) - (revenueRows._sum.debit ?? 0);
  const expenses =
    (expenseRows._sum.debit ?? 0) - (expenseRows._sum.credit ?? 0);
  const margin = revenue - expenses;

  return {
    revenue,
    expenses,
    margin,
    marginRate: revenue > 0 ? margin / revenue : 0,
  };
}

/** Balance of a single account: debit minus credit, up to a date. */
export async function accountBalance(code: string, upTo?: Date) {
  const result = await prisma.journalLine.aggregate({
    where: {
      accountCode: code,
      ...(upTo ? { entry: { date: { lte: upTo } } } : {}),
    },
    _sum: { debit: true, credit: true },
  });
  return (result._sum.debit ?? 0) - (result._sum.credit ?? 0);
}

export async function treasuryPosition(upTo?: Date) {
  const [cash, bank, mobile] = await Promise.all([
    accountBalance(ACC.cash, upTo),
    accountBalance(ACC.bank, upTo),
    accountBalance(ACC.mobileMoney, upTo),
  ]);
  return { cash, bank, mobile, total: cash + bank + mobile };
}

/** What clients still owe, and what the property still owes suppliers. */
export async function thirdPartyPositions(upTo?: Date) {
  const [receivable, advances, payable] = await Promise.all([
    accountBalance(ACC.clients, upTo),
    accountBalance(ACC.clientAdvances, upTo),
    accountBalance(ACC.suppliers, upTo),
  ]);
  return {
    clientsReceivable: receivable,
    clientAdvances: -advances,
    suppliersPayable: -payable,
  };
}

// ---------------------------------------------------------------------------
// Occupancy
// ---------------------------------------------------------------------------

/** Lettable units exclude halls · those are sold by the day, not the night. */
export async function occupancySnapshot(date = new Date()) {
  const { from, to } = dayBounds(date);

  const [lettable, occupied, arrivals, departures, inHouse] = await Promise.all([
    prisma.room.count({ where: { active: true, kind: { not: "HALL" } } }),
    prisma.stay.count({
      where: {
        status: "CHECKED_IN",
        checkIn: { lte: to },
        checkOut: { gte: from },
        room: { kind: { not: "HALL" } },
      },
    }),
    prisma.stay.count({
      where: { status: { in: ["RESERVED", "CHECKED_IN"] }, checkIn: { gte: from, lte: to } },
    }),
    prisma.stay.count({
      where: { status: { in: ["CHECKED_IN", "CHECKED_OUT"] }, checkOut: { gte: from, lte: to } },
    }),
    prisma.stay.count({ where: { status: "CHECKED_IN" } }),
  ]);

  return {
    lettable,
    occupied,
    available: Math.max(lettable - occupied, 0),
    rate: lettable > 0 ? occupied / lettable : 0,
    arrivals,
    departures,
    inHouse,
  };
}

// ---------------------------------------------------------------------------
// Daily statement of collections and disbursements
// ---------------------------------------------------------------------------

export async function dailyCashStatement(date: Date) {
  const { from, to } = dayBounds(date);
  const dayBefore = new Date(from.getTime() - 1);

  const [opening, payments, expenses] = await Promise.all([
    treasuryPosition(dayBefore),
    prisma.payment.findMany({
      where: { cancelled: false, receivedAt: { gte: from, lte: to } },
      include: {
        client: { select: { name: true, code: true } },
        invoice: { select: { number: true } },
        receipt: { select: { number: true } },
      },
      orderBy: { receivedAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { cancelled: false, incurredAt: { gte: from, lte: to } },
      include: {
        category: true,
        department: true,
        supplier: { select: { name: true } },
      },
      orderBy: { incurredAt: "asc" },
    }),
  ]);

  const inflow = payments.reduce((sum, p) => sum + p.amount, 0);
  // Only disbursements actually settled on the day move treasury.
  const outflow = expenses
    .filter((e) => e.paid)
    .reduce((sum, e) => sum + e.total, 0);

  // Carried forward from the journal: an opening balance is posted as a
  // real entry, never held in a setting that would double-count against it.
  const openingTotal = opening.total;

  const byMethodIn = new Map<string, number>();
  for (const p of payments) {
    byMethodIn.set(p.method, (byMethodIn.get(p.method) ?? 0) + p.amount);
  }
  const byMethodOut = new Map<string, number>();
  for (const e of expenses.filter((e) => e.paid)) {
    byMethodOut.set(e.method, (byMethodOut.get(e.method) ?? 0) + e.total);
  }

  return {
    date,
    payments,
    expenses,
    inflow,
    outflow,
    net: inflow - outflow,
    opening: openingTotal,
    closing: openingTotal + inflow - outflow,
    byMethodIn: [...byMethodIn.entries()],
    byMethodOut: [...byMethodOut.entries()],
  };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getVatRate(): Promise<number> {
  const settings = await getSettings();
  const rate = Number(settings["finance.vatRate"] ?? 0);
  return Number.isFinite(rate) ? rate : 0;
}

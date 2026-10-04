import { prisma } from "@/lib/prisma";
import {
  expensesByCategory,
  occupancySnapshot,
  parsePeriod,
  profitAndLoss,
  revenueByDepartment,
  rollingDays,
  thirdPartyPositions,
  toInputDate,
  treasuryPosition,
} from "@/lib/reporting";
import { DashboardView, type DashboardData } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: PageProps<"/admin">) {
  const search = await props.searchParams;
  const from = typeof search.from === "string" ? search.from : undefined;
  const to = typeof search.to === "string" ? search.to : undefined;
  const period = parsePeriod(from, to, rollingDays(30));

  const [pl, occupancy, treasury, thirdParties, revenue, expenses, payments, recentExpenses] =
    await Promise.all([
      profitAndLoss(period),
      occupancySnapshot(),
      treasuryPosition(period.to),
      thirdPartyPositions(period.to),
      revenueByDepartment(period),
      expensesByCategory(period),
      prisma.payment.findMany({
        where: { cancelled: false },
        orderBy: { receivedAt: "desc" },
        take: 6,
        include: { receipt: { select: { number: true } } },
      }),
      prisma.expense.findMany({
        where: { cancelled: false },
        orderBy: { incurredAt: "desc" },
        take: 6,
        include: { category: true },
      }),
    ]);

  const data: DashboardData = {
    periodLabel: { from: toInputDate(period.from), to: toInputDate(period.to) },
    revenue: pl.revenue,
    expenses: pl.expenses,
    margin: pl.margin,
    marginRate: pl.marginRate,
    occupancy: {
      lettable: occupancy.lettable,
      occupied: occupancy.occupied,
      rate: occupancy.rate,
      arrivals: occupancy.arrivals,
      departures: occupancy.departures,
      inHouse: occupancy.inHouse,
    },
    treasury,
    thirdParties,
    revenueByDepartment: revenue.map(({ department, amount }) => ({
      code: department.code,
      nameFr: department.nameFr,
      nameEn: department.nameEn,
      colour: department.colour,
      amount,
    })),
    expensesByCategory: expenses.map(({ category, amount }) => ({
      code: category.code,
      nameFr: category.nameFr,
      nameEn: category.nameEn,
      amount,
    })),
    recentPayments: payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      payerName: p.payerName,
      amount: p.amount,
      method: p.method,
      receivedAt: p.receivedAt.toISOString(),
      receiptNumber: p.receipt?.number ?? null,
    })),
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      reference: e.reference,
      description: e.description,
      total: e.total,
      incurredAt: e.incurredAt.toISOString(),
      categoryNameFr: e.category.nameFr,
      categoryNameEn: e.category.nameEn,
    })),
  };

  return <DashboardView data={data} />;
}

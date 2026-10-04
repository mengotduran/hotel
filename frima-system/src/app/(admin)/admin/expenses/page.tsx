import { prisma } from "@/lib/prisma";
import { monthBounds, toInputDate } from "@/lib/reporting";
import { ExpensesView, type ExpenseRow } from "@/components/treasury/ExpensesView";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const now = new Date();
  const month = monthBounds(now);

  const [expenses, categories, departments, suppliers, accounts, monthAgg, unpaidAgg] =
    await Promise.all([
      prisma.expense.findMany({
        orderBy: { incurredAt: "desc" },
        include: {
          category: true,
          department: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.supplier.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.account.findMany({ where: { klass: 6 }, orderBy: { code: "asc" } }),
      prisma.expense.aggregate({
        where: { cancelled: false, incurredAt: { gte: month.from, lte: month.to } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { cancelled: false, paid: false },
        _sum: { total: true },
      }),
    ]);

  const rows: ExpenseRow[] = expenses.map((expense) => ({
    id: expense.id,
    reference: expense.reference,
    description: expense.description,
    categoryCode: expense.category.code,
    categoryName: { fr: expense.category.nameFr, en: expense.category.nameEn },
    departmentName: expense.department
      ? { fr: expense.department.nameFr, en: expense.department.nameEn }
      : null,
    supplierName: expense.supplier?.name ?? null,
    amount: expense.amount,
    taxAmount: expense.taxAmount,
    total: expense.total,
    method: expense.method,
    paid: expense.paid,
    cancelled: expense.cancelled,
    incurredAt: expense.incurredAt.toISOString(),
  }));

  return (
    <ExpensesView
      expenses={rows}
      categories={categories.map((c) => ({
        id: c.id,
        code: c.code,
        nameFr: c.nameFr,
        nameEn: c.nameEn,
        expenseAccount: c.expenseAccount,
      }))}
      departments={departments.map((d) => ({ id: d.id, nameFr: d.nameFr, nameEn: d.nameEn }))}
      suppliers={suppliers}
      accounts={accounts.map((a) => ({ code: a.code, nameFr: a.nameFr, nameEn: a.nameEn }))}
      today={toInputDate(now)}
      totals={{
        month: monthAgg._sum.total ?? 0,
        unpaid: unpaidAgg._sum.total ?? 0,
      }}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { SuppliersView, type OpenPayable, type SupplierRow } from "@/components/parties/SuppliersView";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      expenses: {
        where: { cancelled: false },
        select: { total: true, paid: true },
      },
    },
  });

  const rows: SupplierRow[] = suppliers.map((supplier) => ({
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    phone: supplier.phone,
    email: supplier.email,
    purchases: supplier.expenses.reduce((sum, e) => sum + e.total, 0),
    payable: supplier.expenses
      .filter((e) => !e.paid)
      .reduce((sum, e) => sum + e.total, 0),
  }));

  const open = await prisma.expense.findMany({
    where: { cancelled: false, paid: false },
    orderBy: { incurredAt: "asc" },
    include: { supplier: { select: { name: true } } },
  });

  const payables: OpenPayable[] = open.map((expense) => ({
    id: expense.id,
    reference: expense.reference,
    supplierName: expense.supplier?.name ?? "—",
    description: expense.description,
    total: expense.total,
    incurredAt: expense.incurredAt.toISOString(),
  }));

  return <SuppliersView suppliers={rows} payables={payables} />;
}

import { prisma } from "@/lib/prisma";
import {
  expensesByDepartment, monthBounds, parsePeriod, revenueByDepartment, toInputDate,
} from "@/lib/reporting";
import { DepartmentsView, type DepartmentSummary } from "@/components/departments/DepartmentsView";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage(props: PageProps<"/admin/departments">) {
  const search = await props.searchParams;
  const period = parsePeriod(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
    monthBounds(new Date()),
  );

  const [departments, revenue, costs, items, unitCounts] = await Promise.all([
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
    revenueByDepartment(period),
    expensesByDepartment(period),
    prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
    }),
    prisma.room.groupBy({ by: ["departmentId"], where: { active: true }, _count: true }),
  ]);

  const summaries: DepartmentSummary[] = departments
    .filter((dept) => dept.code !== "GEN")
    .map((dept) => ({
      id: dept.id,
      code: dept.code,
      nameFr: dept.nameFr,
      nameEn: dept.nameEn,
      colour: dept.colour,
      revenueAccount: dept.revenueAccount,
      revenue: revenue.find((r) => r.department.id === dept.id)?.amount ?? 0,
      directCosts:
        costs.byDepartment.find((c) => c.department.id === dept.id)?.amount ?? 0,
      units: unitCounts.find((u) => u.departmentId === dept.id)?._count ?? 0,
      items: items
        .filter((item) => item.departmentId === dept.id)
        .map((item) => ({
          id: item.id,
          code: item.code,
          nameFr: item.nameFr,
          nameEn: item.nameEn,
          unitPrice: item.unitPrice,
          unit: item.unit,
          category: item.category,
        })),
    }));

  return (
    <DepartmentsView
      departments={summaries}
      period={{ from: toInputDate(period.from), to: toInputDate(period.to) }}
      unallocatedCosts={costs.unallocated}
    />
  );
}

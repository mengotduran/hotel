"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge, Card, EmptyState, PageHeader, StatTile, Table, Td, Th } from "@/components/ui/Kit";

export interface DepartmentSummary {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  colour: string;
  revenueAccount: string;
  revenue: number;
  directCosts: number;
  units: number;
  items: {
    id: string;
    code: string;
    nameFr: string;
    nameEn: string;
    unitPrice: number;
    unit: string;
    category: string | null;
  }[];
}

export function DepartmentsView({
  departments,
  period,
  unallocatedCosts,
}: {
  departments: DepartmentSummary[];
  period: { from: string; to: string };
  unallocatedCosts: number;
}) {
  const { t, n, money, date } = useI18n();

  const totals = departments.reduce(
    (acc, d) => ({
      revenue: acc.revenue + d.revenue,
      costs: acc.costs + d.directCosts,
    }),
    { revenue: 0, costs: 0 },
  );

  return (
    <>
      <PageHeader
        title={t("dept.title")}
        subtitle={`${t("dept.subtitle")} · ${date(period.from)} → ${date(period.to)}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("dept.revenue")} value={money(totals.revenue)} tone="positive" />
        <StatTile label={t("dept.directCosts")} value={money(totals.costs)} tone="negative" />
        <StatTile
          label={t("dept.result")}
          value={money(totals.revenue - totals.costs)}
          tone={totals.revenue - totals.costs >= 0 ? "positive" : "negative"}
          hint={
            unallocatedCosts !== 0
              ? `${money(unallocatedCosts)} ${t("common.none").toLowerCase()} · ${t("common.department").toLowerCase()}`
              : undefined
          }
        />
      </div>

      <div className="mt-6 space-y-4">
        {departments.map((dept) => {
          const result = dept.revenue - dept.directCosts;
          return (
            <Card
              key={dept.id}
              title={n(dept)}
              subtitle={`${t("dept.revenueAccount")} ${dept.revenueAccount} · ${dept.units} ${t("nav.rooms").toLowerCase()}`}
              actions={
                <Badge tone={result >= 0 ? "positive" : "negative"}>
                  {t("dept.result")} {money(result)}
                </Badge>
              }
            >
              <div className="mb-4 flex items-center gap-4">
                <span
                  className="h-10 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dept.colour }}
                />
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {t("dept.revenue")}
                    </p>
                    <p className="tabular mt-1 text-lg font-semibold text-positive">
                      {money(dept.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {t("dept.directCosts")}
                    </p>
                    <p className="tabular mt-1 text-lg font-semibold text-negative">
                      {money(dept.directCosts)}
                    </p>
                  </div>
                </div>
              </div>

              {dept.items.length === 0 ? (
                <EmptyState />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("common.code")}</Th>
                      <Th>{t("common.description")}</Th>
                      <Th>{t("common.category")}</Th>
                      <Th align="right">{t("common.unitPrice")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.items.map((item) => (
                      <tr key={item.id}>
                        <Td className="tabular text-xs text-muted">{item.code}</Td>
                        <Td>{n(item)}</Td>
                        <Td className="text-xs text-muted">{item.category ?? "—"}</Td>
                        <Td align="right" className="font-medium">
                          {money(item.unitPrice)}
                          <span className="ml-1 text-xs font-normal text-muted">
                            / {item.unit}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

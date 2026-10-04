"use client";

import { useI18n } from "@/lib/i18n/context";
import { Card, EmptyState, PageHeader, StatTile, Table, Td, Th } from "@/components/ui/Kit";

export interface SubscriberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export function NewsletterView({ subscribers }: { subscribers: SubscriberRow[] }) {
  const { t, date } = useI18n();

  return (
    <>
      <PageHeader title={t("newsletter.title")} subtitle={t("newsletter.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("common.total")} value={String(subscribers.length)} />
      </div>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {subscribers.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("newsletter.name")}</Th>
                  <Th>{t("common.email")}</Th>
                  <Th>{t("newsletter.registeredAt")}</Th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-medium">
                      {s.firstName} {s.lastName}
                    </Td>
                    <Td>
                      <a href={`mailto:${s.email}`} className="text-info hover:underline">
                        {s.email}
                      </a>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{date(s.createdAt, true)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import {
  Badge, Card, EmptyState, PageHeader, StatTile, Table, Td, Th, type BadgeTone,
} from "@/components/ui/Kit";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const INVOICE_TONE: Record<string, BadgeTone> = {
  OPEN: "neutral",
  ISSUED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "positive",
  CANCELLED: "negative",
};

export interface StatementData {
  client: {
    id: string;
    code: string;
    name: string;
    type: string;
    phone: string | null;
    email: string | null;
    idNumber: string | null;
    address: string | null;
    city: string | null;
    country: string;
  };
  billed: number;
  paid: number;
  outstanding: number;
  invoices: {
    id: string;
    number: string;
    status: string;
    issuedAt: string | null;
    total: number;
    paidTotal: number;
  }[];
  payments: {
    id: string;
    reference: string;
    receivedAt: string;
    amount: number;
    method: string;
    cancelled: boolean;
    receiptNumber: string | null;
  }[];
  stays: {
    id: string;
    reference: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }[];
}

export function ClientStatement({ data }: { data: StatementData }) {
  const { t, money, date } = useI18n();
  const { client } = data;

  return (
    <>
      <PageHeader
        title={client.name}
        subtitle={`${client.code} · ${t(`client.type.${client.type}` as MessageKey)}${client.city ? ` · ${client.city}` : ""}`}
        actions={
          <Link
            href="/admin/clients"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            {t("common.back")}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("client.billed")} value={money(data.billed)} />
        <StatTile label={t("client.paid")} value={money(data.paid)} tone="positive" />
        <StatTile
          label={t("client.outstanding")}
          value={money(data.outstanding)}
          tone={data.outstanding > 0 ? "negative" : "positive"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title={t("client.statement")} className="lg:col-span-2" bodyClassName="p-5 pt-3">
          {data.invoices.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("invoice.number")}</Th>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("common.total")}</Th>
                  <Th align="right">{t("invoice.paidTotal")}</Th>
                  <Th align="right">{t("invoice.remaining")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <Td>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="tabular font-medium text-navy hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {invoice.issuedAt ? date(invoice.issuedAt) : "—"}
                    </Td>
                    <Td>
                      <Badge tone={INVOICE_TONE[invoice.status] ?? "neutral"}>
                        {t(`invoice.status.${invoice.status}` as MessageKey)}
                      </Badge>
                    </Td>
                    <Td align="right">{money(invoice.total)}</Td>
                    <Td align="right" className="text-positive">
                      {money(invoice.paidTotal)}
                    </Td>
                    <Td align="right" className="font-medium">
                      {money(invoice.total - invoice.paidTotal)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title={t("common.phone")} bodyClassName="p-5">
          <dl className="space-y-2.5 text-sm">
            {[
              [t("common.phone"), client.phone],
              [t("common.email"), client.email],
              [t("client.idNumber"), client.idNumber],
              [t("common.address"), client.address],
              [t("common.country"), client.country],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={t("payment.title")} bodyClassName="p-5 pt-3">
          {data.payments.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.date")}</Th>
                  <Th>{t("receipt.number")}</Th>
                  <Th>{t("common.method")}</Th>
                  <Th align="right">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} className={payment.cancelled ? "opacity-50" : ""}>
                    <Td className="whitespace-nowrap text-muted">{date(payment.receivedAt)}</Td>
                    <Td className="tabular text-xs">{payment.receiptNumber ?? "—"}</Td>
                    <Td className="text-muted">
                      {t(`payment.method.${payment.method}` as MessageKey)}
                    </Td>
                    <Td align="right" className={payment.cancelled ? "line-through" : "font-medium"}>
                      {money(payment.amount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title={t("stay.title")} bodyClassName="p-5 pt-3">
          {data.stays.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("common.room")}</Th>
                  <Th>{t("stay.checkIn")}</Th>
                  <Th>{t("stay.checkOut")}</Th>
                  <Th>{t("common.status")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.stays.map((stay) => (
                  <tr key={stay.id}>
                    <Td className="tabular text-xs text-muted">{stay.reference}</Td>
                    <Td>{stay.roomNumber}</Td>
                    <Td className="whitespace-nowrap text-muted">{date(stay.checkIn)}</Td>
                    <Td className="whitespace-nowrap text-muted">{date(stay.checkOut)}</Td>
                    <Td>
                      <span className="text-xs text-muted">
                        {t(`stay.status.${stay.status}` as MessageKey)}
                      </span>
                    </Td>
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

import { prisma } from "@/lib/prisma";
import { dayBounds, monthBounds, toInputDate } from "@/lib/reporting";
import { PaymentsView, type PaymentRow } from "@/components/treasury/PaymentsView";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const now = new Date();
  const day = dayBounds(now);
  const month = monthBounds(now);

  const [payments, openInvoices, clients, todayAgg, monthAgg, receiptCount] =
    await Promise.all([
      prisma.payment.findMany({
        orderBy: { receivedAt: "desc" },
        include: {
          invoice: { select: { number: true } },
          receipt: { select: { id: true, number: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true } } },
      }),
      prisma.client.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.payment.aggregate({
        where: { cancelled: false, receivedAt: { gte: day.from, lte: day.to } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { cancelled: false, receivedAt: { gte: month.from, lte: month.to } },
        _sum: { amount: true },
      }),
      prisma.receipt.count({ where: { cancelled: false } }),
    ]);

  const rows: PaymentRow[] = payments.map((payment) => ({
    id: payment.id,
    reference: payment.reference,
    payerName: payment.payerName,
    clientId: payment.clientId,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice?.number ?? null,
    amount: payment.amount,
    method: payment.method,
    receivedAt: payment.receivedAt.toISOString(),
    cancelled: payment.cancelled,
    receiptId: payment.receipt?.id ?? null,
    receiptNumber: payment.receipt?.number ?? null,
    notes: payment.notes,
  }));

  return (
    <PaymentsView
      payments={rows}
      openInvoices={openInvoices
        .map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          clientName: invoice.client.name,
          remaining: invoice.total - invoice.paidTotal,
        }))
        .filter((invoice) => invoice.remaining > 0)}
      clients={clients}
      today={toInputDate(now)}
      totals={{
        today: todayAgg._sum.amount ?? 0,
        month: monthAgg._sum.amount ?? 0,
        count: receiptCount,
      }}
    />
  );
}

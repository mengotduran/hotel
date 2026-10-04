import { prisma } from "@/lib/prisma";
import { ReceiptsView, type ReceiptRow } from "@/components/treasury/ReceiptsView";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const receipts = await prisma.receipt.findMany({
    orderBy: [{ year: "desc" }, { sequence: "desc" }],
    include: {
      payment: {
        include: { invoice: { select: { number: true } } },
      },
    },
  });

  const rows: ReceiptRow[] = receipts.map((receipt) => ({
    id: receipt.id,
    number: receipt.number,
    sequence: receipt.sequence,
    issuedAt: receipt.issuedAt.toISOString(),
    payerName: receipt.payerName,
    amount: receipt.payment.amount,
    method: receipt.payment.method,
    cancelled: receipt.cancelled,
    cancelReason: receipt.cancelReason,
    invoiceNumber: receipt.payment.invoice?.number ?? null,
  }));

  const active = rows.filter((r) => !r.cancelled);

  return (
    <ReceiptsView
      receipts={rows}
      totals={{
        issued: rows.length,
        cancelled: rows.length - active.length,
        collected: active.reduce((sum, r) => sum + r.amount, 0),
      }}
    />
  );
}

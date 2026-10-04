import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/reporting";
import { ReceiptSheet, type ReceiptSheetData } from "@/components/treasury/ReceiptSheet";

export const dynamic = "force-dynamic";

export default async function ReceiptPage(props: PageProps<"/admin/receipts/[id]">) {
  const { id } = await props.params;

  const [receipt, settings] = await Promise.all([
    prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: { invoice: { select: { id: true, number: true } } },
        },
      },
    }),
    getSettings(),
  ]);

  if (!receipt) notFound();

  const data: ReceiptSheetData = {
    number: receipt.number,
    issuedAt: receipt.issuedAt.toISOString(),
    payerName: receipt.payerName,
    amount: receipt.payment.amount,
    method: receipt.payment.method,
    issuedBy: receipt.issuedBy,
    cancelled: receipt.cancelled,
    cancelReason: receipt.cancelReason,
    invoiceNumber: receipt.payment.invoice?.number ?? null,
    invoiceId: receipt.payment.invoice?.id ?? null,
    notes: receipt.payment.notes,
    hotel: {
      name: settings["hotel.name"] ?? "FRIMA Guest Suites",
      tagline: settings["hotel.tagline.fr"] ?? "",
      address: settings["hotel.address"] ?? "",
      city: settings["hotel.city"] ?? "",
      country: settings["hotel.country"] ?? "",
      phones: settings["hotel.phones"] ?? "",
      taxId: settings["hotel.taxId"] ?? "",
    },
  };

  return <ReceiptSheet data={data} />;
}

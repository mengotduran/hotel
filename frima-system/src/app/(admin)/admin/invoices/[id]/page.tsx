import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toInputDate } from "@/lib/reporting";
import { InvoiceDetail, type InvoiceDetailData } from "@/components/invoices/InvoiceDetail";

export const dynamic = "force-dynamic";

export default async function InvoicePage(props: PageProps<"/admin/invoices/[id]">) {
  const { id } = await props.params;

  const [invoice, departments, serviceItems] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        lines: {
          orderBy: { occurredAt: "asc" },
          include: { department: true },
        },
        payments: {
          orderBy: { receivedAt: "asc" },
          include: { receipt: { select: { id: true, number: true } } },
        },
      },
    }),
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: [{ departmentId: "asc" }, { code: "asc" }],
    }),
  ]);

  if (!invoice) notFound();

  const data: InvoiceDetailData = {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issuedAt: invoice.issuedAt?.toISOString() ?? null,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    subtotal: invoice.subtotal,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    paidTotal: invoice.paidTotal,
    notes: invoice.notes,
    client: {
      id: invoice.client.id,
      name: invoice.client.name,
      code: invoice.client.code,
      phone: invoice.client.phone,
    },
    lines: invoice.lines.map((line) => ({
      id: line.id,
      description: line.description,
      departmentName: { fr: line.department.nameFr, en: line.department.nameEn },
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      amount: line.amount,
      taxAmount: line.taxAmount,
      total: line.total,
      occurredAt: line.occurredAt.toISOString(),
    })),
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      method: payment.method,
      receivedAt: payment.receivedAt.toISOString(),
      cancelled: payment.cancelled,
      receiptId: payment.receipt?.id ?? null,
      receiptNumber: payment.receipt?.number ?? null,
    })),
  };

  return (
    <InvoiceDetail
      invoice={data}
      departments={departments.map((d) => ({
        id: d.id,
        nameFr: d.nameFr,
        nameEn: d.nameEn,
      }))}
      serviceItems={serviceItems.map((item) => ({
        id: item.id,
        code: item.code,
        nameFr: item.nameFr,
        nameEn: item.nameEn,
        unitPrice: item.unitPrice,
        departmentId: item.departmentId,
      }))}
      today={toInputDate(new Date())}
    />
  );
}

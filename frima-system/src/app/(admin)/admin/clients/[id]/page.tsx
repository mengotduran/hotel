import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientStatement, type StatementData } from "@/components/parties/ClientStatement";

export const dynamic = "force-dynamic";

export default async function ClientPage(props: PageProps<"/admin/clients/[id]">) {
  const { id } = await props.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      invoices: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { receivedAt: "desc" },
        include: { receipt: { select: { number: true } } },
      },
      stays: {
        orderBy: { checkIn: "desc" },
        include: { room: { select: { number: true } } },
      },
    },
  });

  if (!client) notFound();

  const issued = client.invoices.filter((i) => i.status !== "OPEN");
  const billed = issued.reduce((sum, i) => sum + i.total, 0);
  const paid = issued.reduce((sum, i) => sum + i.paidTotal, 0);

  const data: StatementData = {
    client: {
      id: client.id,
      code: client.code,
      name: client.name,
      type: client.type,
      phone: client.phone,
      email: client.email,
      idNumber: client.idNumber,
      address: client.address,
      city: client.city,
      country: client.country,
    },
    billed,
    paid,
    outstanding: billed - paid,
    invoices: client.invoices.map((i) => ({
      id: i.id,
      number: i.number,
      status: i.status,
      issuedAt: i.issuedAt?.toISOString() ?? null,
      total: i.total,
      paidTotal: i.paidTotal,
    })),
    payments: client.payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      receivedAt: p.receivedAt.toISOString(),
      amount: p.amount,
      method: p.method,
      cancelled: p.cancelled,
      receiptNumber: p.receipt?.number ?? null,
    })),
    stays: client.stays.map((s) => ({
      id: s.id,
      reference: s.reference,
      roomNumber: s.room.number,
      checkIn: s.checkIn.toISOString(),
      checkOut: s.checkOut.toISOString(),
      status: s.status,
    })),
  };

  return <ClientStatement data={data} />;
}

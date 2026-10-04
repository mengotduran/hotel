import { prisma } from "@/lib/prisma";
import { ClientsView, type ClientRow } from "@/components/parties/ClientsView";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      invoices: {
        where: { status: { not: "CANCELLED" } },
        select: { total: true, paidTotal: true, status: true },
      },
    },
  });

  const rows: ClientRow[] = clients.map((client) => {
    // An open folio is not yet a receivable; only issued invoices count.
    const issued = client.invoices.filter((i) => i.status !== "OPEN");
    const billed = issued.reduce((sum, i) => sum + i.total, 0);
    const paid = issued.reduce((sum, i) => sum + i.paidTotal, 0);
    return {
      id: client.id,
      code: client.code,
      name: client.name,
      type: client.type,
      phone: client.phone,
      email: client.email,
      city: client.city,
      billed,
      paid,
      outstanding: billed - paid,
    };
  });

  return <ClientsView clients={rows} />;
}

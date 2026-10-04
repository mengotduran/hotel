import { prisma } from "@/lib/prisma";
import { InvoicesView, type InvoiceRow } from "@/components/invoices/InvoicesView";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { lines: true } },
      },
    }),
    prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  const rows: InvoiceRow[] = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    clientName: invoice.client.name,
    clientId: invoice.client.id,
    status: invoice.status,
    issuedAt: invoice.issuedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    total: invoice.total,
    paidTotal: invoice.paidTotal,
    lineCount: invoice._count.lines,
  }));

  return <InvoicesView invoices={rows} clients={clients} />;
}

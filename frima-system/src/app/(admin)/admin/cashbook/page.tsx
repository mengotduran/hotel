import { dailyCashStatement, getSettings, toInputDate } from "@/lib/reporting";
import { CashBookView, type CashBookData } from "@/components/treasury/CashBookView";

export const dynamic = "force-dynamic";

export default async function CashBookPage(props: PageProps<"/admin/cashbook">) {
  const search = await props.searchParams;
  const raw = typeof search.date === "string" ? search.date : undefined;
  const parsed = raw ? new Date(`${raw}T12:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  const [statement, settings] = await Promise.all([
    dailyCashStatement(date),
    getSettings(),
  ]);

  const data: CashBookData = {
    date: toInputDate(date),
    opening: statement.opening,
    inflow: statement.inflow,
    outflow: statement.outflow,
    net: statement.net,
    closing: statement.closing,
    byMethodIn: statement.byMethodIn,
    byMethodOut: statement.byMethodOut,
    collections: statement.payments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      receiptNumber: payment.receipt?.number ?? null,
      payerName: payment.payerName,
      invoiceNumber: payment.invoice?.number ?? null,
      method: payment.method,
      amount: payment.amount,
    })),
    disbursements: statement.expenses.map((expense) => ({
      id: expense.id,
      reference: expense.reference,
      description: expense.description,
      categoryCode: expense.category.code,
      departmentName: expense.department
        ? { fr: expense.department.nameFr, en: expense.department.nameEn }
        : null,
      supplierName: expense.supplier?.name ?? null,
      method: expense.method,
      total: expense.total,
      paid: expense.paid,
    })),
    hotelName: settings["hotel.name"] ?? "FRIMA Guest Suites",
  };

  return <CashBookView data={data} />;
}

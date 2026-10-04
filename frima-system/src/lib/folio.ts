import type { Tx } from "@/lib/sequence";
import { nextSequence } from "@/lib/sequence";
import { splitTax } from "@/lib/actions/shared";

/**
 * Folio helpers shared by the stay, invoice and payment actions. Kept out of
 * the `"use server"` modules, which may only export actions.
 */

export const ACCOMMODATION_LINE_TAG = "__nights__";

/** Recomputes an invoice's totals and status from its lines and payments. */
export async function recalcInvoice(tx: Tx, invoiceId: string) {
  const [lines, payments, invoice] = await Promise.all([
    tx.invoiceLine.findMany({ where: { invoiceId } }),
    tx.payment.findMany({ where: { invoiceId, cancelled: false } }),
    tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } }),
  ]);

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const taxTotal = lines.reduce((sum, l) => sum + l.taxAmount, 0);
  const total = subtotal + taxTotal;
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  let status = invoice.status;
  if (status !== "CANCELLED" && status !== "OPEN") {
    if (paidTotal <= 0) status = "ISSUED";
    else if (paidTotal < total) status = "PARTIALLY_PAID";
    else status = "PAID";
  }

  return tx.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, taxTotal, total, paidTotal, status },
  });
}

/** Finds the client's open folio, or opens one. */
export async function ensureOpenInvoice(
  tx: Tx,
  clientId: string,
  at: Date,
): Promise<string> {
  const existing = await tx.invoice.findFirst({
    where: { clientId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const { formatted } = await nextSequence(tx, "INVOICE", at.getFullYear());
  const created = await tx.invoice.create({
    data: { number: formatted, clientId, status: "OPEN" },
  });
  return created.id;
}

export interface LineInput {
  departmentId: string;
  revenueAccount: string;
  serviceItemId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  taxable: boolean;
  /** Prices quoted to guests in Cameroon are normally VAT-inclusive. */
  taxInclusive: boolean;
  occurredAt?: Date;
}

export async function addInvoiceLine(
  tx: Tx,
  invoiceId: string,
  input: LineInput,
) {
  const gross = Math.round(input.quantity * input.unitPrice);
  const rate = input.taxable ? input.vatRate : 0;
  const { net, tax, total } = splitTax(gross, rate, input.taxInclusive);

  return tx.invoiceLine.create({
    data: {
      invoiceId,
      departmentId: input.departmentId,
      serviceItemId: input.serviceItemId ?? null,
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      taxRate: rate,
      amount: net,
      taxAmount: tax,
      total,
      revenueAccount: input.revenueAccount,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

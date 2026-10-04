"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { addInvoiceLine, recalcInvoice } from "@/lib/folio";
import { postInvoiceIssued, reverseEntriesFor } from "@/lib/accounting/posting";
import { getVatRate } from "@/lib/reporting";
import {
  bool, date, fail, money, num, optionalDate, optionalStr, str, toMessage,
  type ActionResult,
} from "./shared";

export async function createInvoice(form: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const clientId = str(form, "clientId");
    if (!clientId) return fail("Le client est obligatoire.");

    const created = await prisma.$transaction(async (tx) => {
      const { formatted } = await nextSequence(tx, "INVOICE");
      return tx.invoice.create({
        data: {
          number: formatted,
          clientId,
          status: "OPEN",
          notes: optionalStr(form, "notes"),
        },
      });
    });

    revalidatePath("/admin/invoices");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/** Adds a consumption line · a bar round, a hall booking, a laundry charge. */
export async function addLine(form: FormData): Promise<ActionResult> {
  try {
    const invoiceId = str(form, "invoiceId");
    const serviceItemId = optionalStr(form, "serviceItemId");
    const quantity = Math.max(num(form, "quantity", 1), 0.01);
    if (!invoiceId) return fail("Facture introuvable.");

    const vatRate = await getVatRate();

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
      if (invoice.status !== "OPEN") {
        throw new Error("Seule une facture ouverte peut être modifiée.");
      }

      let departmentId: string;
      let revenueAccount: string;
      let description: string;
      let unitPrice: number;
      let taxable: boolean;

      if (serviceItemId) {
        const item = await tx.serviceItem.findUniqueOrThrow({
          where: { id: serviceItemId },
          include: { department: true },
        });
        departmentId = item.departmentId;
        revenueAccount = item.department.revenueAccount;
        description = str(form, "description") || item.nameFr;
        const override = money(form, "unitPrice");
        unitPrice = override > 0 ? override : item.unitPrice;
        taxable = item.taxable;
      } else {
        departmentId = str(form, "departmentId");
        if (!departmentId) throw new Error("Le département est obligatoire.");
        const department = await tx.department.findUniqueOrThrow({
          where: { id: departmentId },
        });
        revenueAccount = department.revenueAccount;
        description = str(form, "description");
        if (!description) throw new Error("La description est obligatoire.");
        unitPrice = money(form, "unitPrice");
        taxable = bool(form, "taxable");
      }

      await addInvoiceLine(tx, invoiceId, {
        departmentId,
        revenueAccount,
        serviceItemId,
        description,
        quantity,
        unitPrice,
        vatRate,
        taxable,
        taxInclusive: true,
        occurredAt: date(form, "occurredAt"),
      });

      await recalcInvoice(tx, invoiceId);
    });

    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function removeLine(lineId: string): Promise<ActionResult> {
  try {
    const invoiceId = await prisma.$transaction(async (tx) => {
      const line = await tx.invoiceLine.findUniqueOrThrow({
        where: { id: lineId },
        include: { invoice: true },
      });
      if (line.invoice.status !== "OPEN") {
        throw new Error("Seule une facture ouverte peut être modifiée.");
      }
      await tx.invoiceLine.delete({ where: { id: lineId } });
      await recalcInvoice(tx, line.invoiceId);
      return line.invoiceId;
    });

    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/**
 * Issuing is the point revenue is recognised: the folio becomes a numbered
 * document and the matching entry hits the sales journal.
 */
export async function issueInvoice(form: FormData): Promise<ActionResult> {
  try {
    const invoiceId = str(form, "invoiceId");
    const issuedAt = date(form, "issuedAt");
    const dueDate = optionalDate(form, "dueDate");

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { lines: true, client: true },
      });

      if (invoice.status !== "OPEN") {
        throw new Error("Cette facture a déjà été émise.");
      }
      if (invoice.lines.length === 0) {
        throw new Error("Impossible d'émettre une facture sans ligne.");
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "ISSUED", issuedAt, dueDate },
      });

      const refreshed = await recalcInvoice(tx, invoiceId);

      await postInvoiceIssued(
        tx,
        {
          id: invoice.id,
          number: invoice.number,
          total: refreshed.total,
          issuedAt,
          clientName: invoice.client.name,
        },
        invoice.lines.map((line) => ({
          departmentId: line.departmentId,
          revenueAccount: line.revenueAccount,
          description: line.description,
          amount: line.amount,
          taxAmount: line.taxAmount,
        })),
      );
    });

    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
    revalidatePath("/admin/accounting/journal");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function cancelInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { payments: { where: { cancelled: false } } },
      });

      if (invoice.status === "CANCELLED") return;
      if (invoice.payments.length > 0) {
        throw new Error(
          "Annulez d'abord les encaissements rattachés à cette facture.",
        );
      }

      if (invoice.status !== "OPEN") {
        await reverseEntriesFor(
          tx,
          "INVOICE",
          invoiceId,
          `Annulation facture ${invoice.number}`,
        );
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "CANCELLED" },
      });
    });

    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath("/admin/invoices");
    revalidatePath("/admin/accounting/journal");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

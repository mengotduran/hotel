"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { recalcInvoice } from "@/lib/folio";
import {
  postExpense, postPaymentReceived, postSupplierSettlement, reverseEntriesFor,
} from "@/lib/accounting/posting";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/accounting/chart";
import { amountInWords } from "@/lib/money";
import {
  bool, date, fail, money, optionalStr, str, toMessage,
  type ActionResult,
} from "./shared";

function asMethod(value: string): PaymentMethod {
  return (PAYMENT_METHODS as string[]).includes(value)
    ? (value as PaymentMethod)
    : "CASH";
}

// ---------------------------------------------------------------------------
// Collections: every one produces a numbered receipt
// ---------------------------------------------------------------------------

export async function recordPayment(
  form: FormData,
): Promise<ActionResult<{ paymentId: string; receiptNumber: string }>> {
  try {
    const amount = money(form, "amount");
    if (amount <= 0) return fail("Le montant doit être supérieur à zéro.");

    const invoiceId = optionalStr(form, "invoiceId");
    let clientId = optionalStr(form, "clientId");
    const method = asMethod(str(form, "method"));
    const receivedAt = date(form, "receivedAt");
    const issuedBy = optionalStr(form, "issuedBy");

    const result = await prisma.$transaction(async (tx) => {
      let invoiceNumber: string | null = null;

      if (invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: invoiceId },
          include: { client: true },
        });
        if (invoice.status === "CANCELLED") {
          throw new Error("Cette facture est annulée.");
        }
        if (invoice.status === "OPEN") {
          throw new Error(
            "Émettez la facture avant d'enregistrer un encaissement.",
          );
        }
        const remaining = invoice.total - invoice.paidTotal;
        if (amount > remaining) {
          throw new Error(
            `Le montant dépasse le reste dû (${remaining} FCFA) sur la facture ${invoice.number}.`,
          );
        }
        clientId = invoice.clientId;
        invoiceNumber = invoice.number;
      }

      const payerName =
        str(form, "payerName") ||
        (clientId
          ? (await tx.client.findUniqueOrThrow({ where: { id: clientId } })).name
          : "");
      if (!payerName) throw new Error("Le nom du payeur est obligatoire.");

      const { formatted: reference } = await nextSequence(
        tx, "PAYMENT", receivedAt.getFullYear(),
      );

      const payment = await tx.payment.create({
        data: {
          reference,
          clientId,
          invoiceId,
          amount,
          method,
          receivedAt,
          payerName,
          notes: optionalStr(form, "notes"),
        },
      });

      const year = receivedAt.getFullYear();
      const { value, formatted: receiptNumber } = await nextSequence(
        tx, "RECEIPT", year,
      );

      await tx.receipt.create({
        data: {
          number: receiptNumber,
          series: "REC",
          year,
          sequence: value,
          paymentId: payment.id,
          issuedAt: receivedAt,
          issuedBy,
          payerName,
          // Stored in French: the receipt is the legal record.
          amountInWords: amountInWords(amount, "fr"),
        },
      });

      await postPaymentReceived(tx, {
        id: payment.id,
        reference,
        amount,
        method,
        receivedAt,
        payerName,
        invoiceNumber,
      });

      if (invoiceId) await recalcInvoice(tx, invoiceId);

      return { paymentId: payment.id, receiptNumber };
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/receipts");
    revalidatePath("/admin/cashbook");
    revalidatePath("/admin/accounting/journal");
    revalidatePath("/admin");
    if (invoiceId) revalidatePath(`/admin/invoices/${invoiceId}`);
    if (clientId) revalidatePath(`/admin/clients/${clientId}`);

    return { ok: true, data: result };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/**
 * Collections are never deleted: the receipt sequence has to stay unbroken,
 * so a mistake is cancelled and the entry reversed.
 */
export async function cancelPayment(
  paymentId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    if (!reason.trim()) return fail("Le motif d'annulation est obligatoire.");

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { receipt: true },
      });
      if (payment.cancelled) return;

      await tx.payment.update({
        where: { id: paymentId },
        data: { cancelled: true },
      });

      if (payment.receipt) {
        await tx.receipt.update({
          where: { id: payment.receipt.id },
          data: { cancelled: true, cancelReason: reason.trim() },
        });
      }

      await reverseEntriesFor(
        tx,
        "PAYMENT",
        paymentId,
        `Annulation encaissement ${payment.reference}`,
      );

      if (payment.invoiceId) await recalcInvoice(tx, payment.invoiceId);
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/receipts");
    revalidatePath("/admin/cashbook");
    revalidatePath("/admin/accounting/journal");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// ---------------------------------------------------------------------------
// Disbursements
// ---------------------------------------------------------------------------

export async function recordExpense(form: FormData): Promise<ActionResult> {
  try {
    const categoryId = str(form, "categoryId");
    const description = str(form, "description");
    const amount = money(form, "amount");
    const taxAmount = Math.max(money(form, "taxAmount"), 0);

    if (!categoryId) return fail("La nature de la charge est obligatoire.");
    if (!description) return fail("La description est obligatoire.");
    if (amount <= 0) return fail("Le montant doit être supérieur à zéro.");

    const method = asMethod(str(form, "method"));
    const incurredAt = date(form, "incurredAt");
    const paid = bool(form, "paid");
    const departmentId = optionalStr(form, "departmentId");
    const supplierId = optionalStr(form, "supplierId");

    await prisma.$transaction(async (tx) => {
      const category = await tx.expenseCategory.findUniqueOrThrow({
        where: { id: categoryId },
      });
      const supplier = supplierId
        ? await tx.supplier.findUniqueOrThrow({ where: { id: supplierId } })
        : null;

      if (!paid && !supplierId) {
        throw new Error(
          "Une charge non réglée doit être rattachée à un fournisseur.",
        );
      }

      const { formatted: reference } = await nextSequence(
        tx, "EXPENSE", incurredAt.getFullYear(),
      );
      const total = amount + taxAmount;

      const expense = await tx.expense.create({
        data: {
          reference,
          categoryId,
          departmentId,
          supplierId,
          description,
          amount,
          taxAmount,
          total,
          method,
          paid,
          incurredAt,
          paidAt: paid ? incurredAt : null,
          notes: optionalStr(form, "notes"),
        },
      });

      // The expense account can be overridden per entry (water vs electricity
      // vs fuel all sit under the same "energy" family).
      const expenseAccount = optionalStr(form, "expenseAccount") ?? category.expenseAccount;

      await postExpense(tx, {
        id: expense.id,
        reference,
        description,
        amount,
        taxAmount,
        total,
        method,
        paid,
        incurredAt,
        expenseAccount,
        departmentId,
        supplierName: supplier?.name ?? null,
      });
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/cashbook");
    revalidatePath("/admin/suppliers");
    revalidatePath("/admin/accounting/journal");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/** Settles a charge that was first booked on credit. */
export async function settleExpense(
  expenseId: string,
  method: string,
): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUniqueOrThrow({
        where: { id: expenseId },
        include: { supplier: true },
      });
      if (expense.cancelled) throw new Error("Cette charge est annulée.");
      if (expense.paid) throw new Error("Cette charge est déjà réglée.");

      const paidAt = new Date();
      const resolved = asMethod(method);

      await tx.expense.update({
        where: { id: expenseId },
        data: { paid: true, paidAt, method: resolved },
      });

      await postSupplierSettlement(tx, {
        id: expense.id,
        reference: expense.reference,
        total: expense.total,
        method: resolved,
        paidAt,
        supplierName: expense.supplier?.name ?? null,
      });
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/cashbook");
    revalidatePath("/admin/suppliers");
    revalidatePath("/admin/accounting/journal");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function cancelExpense(
  expenseId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    if (!reason.trim()) return fail("Le motif d'annulation est obligatoire.");

    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUniqueOrThrow({
        where: { id: expenseId },
      });
      if (expense.cancelled) return;

      await tx.expense.update({
        where: { id: expenseId },
        data: {
          cancelled: true,
          notes: [expense.notes, `Annulé : ${reason.trim()}`]
            .filter(Boolean)
            .join("\n"),
        },
      });

      await reverseEntriesFor(
        tx,
        "EXPENSE",
        expenseId,
        `Annulation ${expense.reference}`,
      );
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/cashbook");
    revalidatePath("/admin/accounting/journal");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

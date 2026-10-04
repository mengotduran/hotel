import { nextSequence, type Tx } from "@/lib/sequence";
import { ACC, treasuryFor, type PaymentMethod } from "./chart";

export type JournalCode = "VT" | "AC" | "CA" | "BQ" | "OD";

export interface DraftLine {
  accountCode: string;
  /** Analytical axis · set on every revenue and direct-cost line. */
  departmentId?: string | null;
  label: string;
  debit?: number;
  credit?: number;
}

export interface DraftEntry {
  journal: JournalCode;
  date: Date;
  label: string;
  sourceType?: "INVOICE" | "PAYMENT" | "EXPENSE" | "MANUAL";
  sourceId?: string;
  lines: DraftLine[];
}

export class UnbalancedEntryError extends Error {
  constructor(debit: number, credit: number) {
    super(
      `Journal entry does not balance: debit ${debit} vs credit ${credit} XAF.`,
    );
    this.name = "UnbalancedEntryError";
  }
}

/**
 * Writes one balanced entry. Every mutation that has an accounting
 * consequence goes through here, so the journal is always a faithful mirror
 * of operations rather than something re-keyed by hand afterwards.
 */
export async function postEntry(tx: Tx, draft: DraftEntry) {
  const lines = draft.lines
    .map((line) => ({
      accountCode: line.accountCode,
      departmentId: line.departmentId ?? null,
      label: line.label,
      debit: Math.round(line.debit ?? 0),
      credit: Math.round(line.credit ?? 0),
    }))
    .filter((line) => line.debit !== 0 || line.credit !== 0);

  if (lines.length === 0) return null;

  const debit = lines.reduce((sum, l) => sum + l.debit, 0);
  const credit = lines.reduce((sum, l) => sum + l.credit, 0);
  if (debit !== credit) throw new UnbalancedEntryError(debit, credit);

  const { formatted } = await nextSequence(tx, "JOURNAL", draft.date.getFullYear());

  return tx.journalEntry.create({
    data: {
      number: formatted,
      journal: draft.journal,
      date: draft.date,
      label: draft.label,
      sourceType: draft.sourceType,
      sourceId: draft.sourceId,
      lines: { create: lines },
    },
    include: { lines: true },
  });
}

/**
 * Reverses an entry by posting its mirror image, rather than deleting it.
 * Deleting would break the numbering an auditor reads down.
 */
export async function reverseEntriesFor(
  tx: Tx,
  sourceType: "INVOICE" | "PAYMENT" | "EXPENSE",
  sourceId: string,
  label: string,
  date = new Date(),
) {
  const originals = await tx.journalEntry.findMany({
    where: { sourceType, sourceId, reversalOf: null },
    include: { lines: true },
  });

  for (const original of originals) {
    const already = await tx.journalEntry.findFirst({
      where: { reversalOf: original.id },
    });
    if (already) continue;

    const { formatted } = await nextSequence(tx, "JOURNAL", date.getFullYear());
    await tx.journalEntry.create({
      data: {
        number: formatted,
        journal: original.journal,
        date,
        label: `${label} · ${original.number}`,
        sourceType,
        sourceId,
        reversalOf: original.id,
        lines: {
          create: original.lines.map((line) => ({
            accountCode: line.accountCode,
            departmentId: line.departmentId,
            label: line.label,
            debit: line.credit,
            credit: line.debit,
          })),
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Business events
// ---------------------------------------------------------------------------

export interface InvoiceLineForPosting {
  departmentId: string;
  revenueAccount: string;
  description: string;
  amount: number;
  taxAmount: number;
}

/**
 * Issuing an invoice recognises the revenue, department by department, and
 * opens the receivable on the client's account.
 */
export async function postInvoiceIssued(
  tx: Tx,
  invoice: {
    id: string;
    number: string;
    total: number;
    issuedAt: Date;
    clientName: string;
  },
  lines: InvoiceLineForPosting[],
) {
  const draft: DraftEntry = {
    journal: "VT",
    date: invoice.issuedAt,
    label: `Facture ${invoice.number} · ${invoice.clientName}`,
    sourceType: "INVOICE",
    sourceId: invoice.id,
    lines: [
      {
        accountCode: ACC.clients,
        label: `${invoice.clientName} · facture ${invoice.number}`,
        debit: invoice.total,
      },
    ],
  };

  // One revenue line per department/account pair keeps the analytical view
  // readable instead of exploding into one line per invoice line.
  const byAccount = new Map<string, { departmentId: string; amount: number; label: string }>();
  let taxTotal = 0;

  for (const line of lines) {
    taxTotal += line.taxAmount;
    const key = `${line.revenueAccount}|${line.departmentId}`;
    const existing = byAccount.get(key);
    if (existing) {
      existing.amount += line.amount;
    } else {
      byAccount.set(key, {
        departmentId: line.departmentId,
        amount: line.amount,
        label: line.description,
      });
    }
  }

  for (const [key, group] of byAccount) {
    const [accountCode] = key.split("|");
    draft.lines.push({
      accountCode,
      departmentId: group.departmentId,
      label: `Facture ${invoice.number}`,
      credit: group.amount,
    });
  }

  if (taxTotal > 0) {
    draft.lines.push({
      accountCode: ACC.vatOnSales,
      label: `TVA facturée · ${invoice.number}`,
      credit: taxTotal,
    });
  }

  return postEntry(tx, draft);
}

/**
 * A collection moves money into a treasury account and clears the
 * receivable, or, with no invoice behind it, sits as an advance.
 */
export async function postPaymentReceived(
  tx: Tx,
  payment: {
    id: string;
    reference: string;
    amount: number;
    method: PaymentMethod;
    receivedAt: Date;
    payerName: string;
    invoiceNumber?: string | null;
  },
) {
  const { account, journal } = treasuryFor(payment.method);
  const counterpart = payment.invoiceNumber ? ACC.clients : ACC.clientAdvances;
  const narrative = payment.invoiceNumber
    ? `Encaissement ${payment.reference} · facture ${payment.invoiceNumber}`
    : `Acompte ${payment.reference} · ${payment.payerName}`;

  return postEntry(tx, {
    journal,
    date: payment.receivedAt,
    label: narrative,
    sourceType: "PAYMENT",
    sourceId: payment.id,
    lines: [
      { accountCode: account, label: narrative, debit: payment.amount },
      { accountCode: counterpart, label: payment.payerName, credit: payment.amount },
    ],
  });
}

/**
 * A disbursement charges the department that consumed it (the analytical
 * angle) and either settles immediately or leaves a supplier payable.
 */
export async function postExpense(
  tx: Tx,
  expense: {
    id: string;
    reference: string;
    description: string;
    amount: number;
    taxAmount: number;
    total: number;
    method: PaymentMethod;
    paid: boolean;
    incurredAt: Date;
    expenseAccount: string;
    departmentId?: string | null;
    supplierName?: string | null;
  },
) {
  const treasury = treasuryFor(expense.method);
  const journal: JournalCode = expense.paid ? treasury.journal : "AC";
  const label = `${expense.reference} · ${expense.description}`;

  const lines: DraftLine[] = [
    {
      accountCode: expense.expenseAccount,
      departmentId: expense.departmentId ?? null,
      label,
      debit: expense.amount,
    },
  ];

  if (expense.taxAmount > 0) {
    lines.push({
      accountCode: ACC.vatOnPurchases,
      label: `TVA récupérable · ${expense.reference}`,
      debit: expense.taxAmount,
    });
  }

  lines.push({
    accountCode: expense.paid ? treasury.account : ACC.suppliers,
    label: expense.supplierName ?? label,
    credit: expense.total,
  });

  return postEntry(tx, {
    journal,
    date: expense.incurredAt,
    label,
    sourceType: "EXPENSE",
    sourceId: expense.id,
    lines,
  });
}

/** Settling a supplier invoice that was booked on credit earlier. */
export async function postSupplierSettlement(
  tx: Tx,
  expense: {
    id: string;
    reference: string;
    total: number;
    method: PaymentMethod;
    paidAt: Date;
    supplierName?: string | null;
  },
) {
  const { account, journal } = treasuryFor(expense.method);
  const label = `Règlement fournisseur · ${expense.reference}`;

  return postEntry(tx, {
    journal,
    date: expense.paidAt,
    label,
    sourceType: "EXPENSE",
    sourceId: expense.id,
    lines: [
      {
        accountCode: ACC.suppliers,
        label: expense.supplierName ?? label,
        debit: expense.total,
      },
      { accountCode: account, label, credit: expense.total },
    ],
  });
}

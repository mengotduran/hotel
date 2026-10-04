import type { Prisma } from "@/generated/prisma/client";

export type Tx = Prisma.TransactionClient;

/**
 * Document numbering. Counters live in the `Sequence` table and are bumped
 * inside the caller's transaction, so a rolled-back operation never burns a
 * number, which matters for receipts, where the law expects an unbroken run.
 */
export type SequenceKind =
  | "RECEIPT"
  | "INVOICE"
  | "PAYMENT"
  | "EXPENSE"
  | "STAY"
  | "JOURNAL"
  | "CLIENT"
  | "SUPPLIER"
  | "BOOKING";

const PREFIX: Record<SequenceKind, string> = {
  RECEIPT: "REC",
  INVOICE: "FAC",
  PAYMENT: "ENC",
  EXPENSE: "DEC",
  STAY: "RES",
  JOURNAL: "JRN",
  CLIENT: "CLI",
  SUPPLIER: "FRS",
  BOOKING: "DEM",
};

const PAD: Record<SequenceKind, number> = {
  RECEIPT: 5,
  INVOICE: 5,
  PAYMENT: 5,
  EXPENSE: 5,
  STAY: 5,
  JOURNAL: 6,
  CLIENT: 4,
  SUPPLIER: 4,
  BOOKING: 4,
};

/** Counters that restart each calendar year carry the year in their key. */
const YEARLY: Record<SequenceKind, boolean> = {
  RECEIPT: true,
  INVOICE: true,
  PAYMENT: true,
  EXPENSE: true,
  STAY: true,
  JOURNAL: true,
  CLIENT: false,
  SUPPLIER: false,
  BOOKING: true,
};

export async function nextSequence(
  tx: Tx,
  kind: SequenceKind,
  year = new Date().getFullYear(),
): Promise<{ value: number; formatted: string }> {
  const key = YEARLY[kind] ? `${kind}:${year}` : kind;

  const row = await tx.sequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  const value = row.value;
  const number = String(value).padStart(PAD[kind], "0");
  const formatted = YEARLY[kind]
    ? `${PREFIX[kind]}-${year}-${number}`
    : `${PREFIX[kind]}-${number}`;

  return { value, formatted };
}

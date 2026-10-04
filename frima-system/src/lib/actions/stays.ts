"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSequence, type Tx } from "@/lib/sequence";
import {
  ACCOMMODATION_LINE_TAG, addInvoiceLine, ensureOpenInvoice, recalcInvoice,
} from "@/lib/folio";
import { getVatRate } from "@/lib/reporting";
import { publish } from "@/lib/live/bus";
import {
  date, fail, int, money, nightsBetween, optionalStr, str, toMessage,
  type ActionResult,
} from "./shared";

const BLOCKING_STATUSES = ["RESERVED", "CHECKED_IN"];

/** Two stays clash when one starts before the other ends, and vice versa. */
async function findClash(
  tx: Tx,
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeStayId?: string,
) {
  return tx.stay.findFirst({
    where: {
      roomId,
      status: { in: BLOCKING_STATUSES },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeStayId ? { NOT: { id: excludeStayId } } : {}),
    },
    select: { reference: true, checkIn: true, checkOut: true },
  });
}

/**
 * Writes the room-night charge onto the open folio, replacing any previous
 * one. Called at check-in with the planned dates and again at check-out with
 * the actual dates, so the folio always reflects nights really sold.
 */
async function syncAccommodationCharge(
  tx: Tx,
  stayId: string,
  vatRate: number,
) {
  const stay = await tx.stay.findUniqueOrThrow({
    where: { id: stayId },
    include: { room: { include: { department: true } } },
  });
  if (!stay.invoiceId) return;

  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: stay.invoiceId },
  });
  // Once a folio is issued it is a legal document, so adjust it by hand.
  if (invoice.status !== "OPEN") return;

  await tx.invoiceLine.deleteMany({
    where: { invoiceId: stay.invoiceId, description: { startsWith: ACCOMMODATION_LINE_TAG } },
  });

  // Billing runs from the booked arrival date, since a guest who turns up
  // late still owes the night they reserved, through to the departure date,
  // which only moves once they have actually left.
  const departure =
    stay.actualCheckOut && stay.actualCheckOut > stay.checkIn
      ? stay.actualCheckOut
      : stay.checkOut;
  const nights = nightsBetween(stay.checkIn, departure);

  await addInvoiceLine(tx, stay.invoiceId, {
    departmentId: stay.room.departmentId,
    revenueAccount: stay.room.department.revenueAccount,
    description: `${ACCOMMODATION_LINE_TAG}${stay.room.number} · ${nights} nuitée(s)`,
    quantity: nights,
    unitPrice: stay.nightlyRate,
    vatRate,
    taxable: true,
    taxInclusive: true,
  });

  await recalcInvoice(tx, stay.invoiceId);
}

export async function createStay(form: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const roomId = str(form, "roomId");
    const clientId = str(form, "clientId");
    const checkIn = date(form, "checkIn");
    const checkOut = date(form, "checkOut");

    if (!roomId) return fail("L'unité est obligatoire.");
    if (!clientId) return fail("Le client est obligatoire.");
    if (checkOut <= checkIn) {
      return fail("La date de départ doit être postérieure à la date d'arrivée.");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return fail("Unité introuvable.");
    if (!room.active) return fail("Cette unité est désactivée.");

    const nightlyRateInput = money(form, "nightlyRate");
    const nightlyRate = nightlyRateInput > 0 ? nightlyRateInput : room.baseRate;

    const created = await prisma.$transaction(async (tx) => {
      const clash = await findClash(tx, roomId, checkIn, checkOut);
      if (clash) {
        throw new Error(
          `Unité déjà réservée (${clash.reference}) du ${clash.checkIn.toLocaleDateString("fr-FR")} au ${clash.checkOut.toLocaleDateString("fr-FR")}.`,
        );
      }

      const { formatted } = await nextSequence(tx, "STAY", checkIn.getFullYear());
      return tx.stay.create({
        data: {
          reference: formatted,
          roomId,
          clientId,
          checkIn,
          checkOut,
          adults: Math.max(int(form, "adults", 1), 1),
          children: Math.max(int(form, "children", 0), 0),
          nightlyRate,
          status: "RESERVED",
          notes: optionalStr(form, "notes"),
        },
      });
    });

    publish("availability", "stay");
    revalidatePath("/admin/occupancy");
    revalidatePath("/admin/rooms");
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function checkInStay(stayId: string): Promise<ActionResult> {
  try {
    const vatRate = await getVatRate();

    await prisma.$transaction(async (tx) => {
      const stay = await tx.stay.findUniqueOrThrow({ where: { id: stayId } });
      if (stay.status !== "RESERVED") {
        throw new Error("Seule une réservation peut faire l'objet d'une arrivée.");
      }

      const now = new Date();
      const invoiceId =
        stay.invoiceId ?? (await ensureOpenInvoice(tx, stay.clientId, now));

      await tx.stay.update({
        where: { id: stayId },
        data: { status: "CHECKED_IN", actualCheckIn: now, invoiceId },
      });
      await tx.room.update({
        where: { id: stay.roomId },
        data: { status: "OCCUPIED" },
      });

      await syncAccommodationCharge(tx, stayId, vatRate);
    });

    publish("availability", "stay");
    revalidatePath("/admin/occupancy");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function checkOutStay(stayId: string): Promise<ActionResult> {
  try {
    const vatRate = await getVatRate();

    await prisma.$transaction(async (tx) => {
      const stay = await tx.stay.findUniqueOrThrow({ where: { id: stayId } });
      if (stay.status !== "CHECKED_IN") {
        throw new Error("Ce séjour n'est pas en cours.");
      }

      await tx.stay.update({
        where: { id: stayId },
        data: { status: "CHECKED_OUT", actualCheckOut: new Date() },
      });
      // Housekeeping takes the unit next; it is not sellable until cleaned.
      await tx.room.update({
        where: { id: stay.roomId },
        data: { status: "CLEANING" },
      });

      await syncAccommodationCharge(tx, stayId, vatRate);
    });

    publish("availability", "stay");
    revalidatePath("/admin/occupancy");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function cancelStay(
  stayId: string,
  noShow = false,
): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const stay = await tx.stay.findUniqueOrThrow({ where: { id: stayId } });
      if (stay.status === "CHECKED_OUT") {
        throw new Error("Un séjour terminé ne peut pas être annulé.");
      }

      await tx.stay.update({
        where: { id: stayId },
        data: { status: noShow ? "NO_SHOW" : "CANCELLED" },
      });

      if (stay.status === "CHECKED_IN") {
        await tx.room.update({
          where: { id: stay.roomId },
          data: { status: "CLEANING" },
        });
      }

      // Drop the room-night charge from an unissued folio.
      if (stay.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: stay.invoiceId },
        });
        if (invoice.status === "OPEN") {
          await tx.invoiceLine.deleteMany({
            where: {
              invoiceId: stay.invoiceId,
              description: { startsWith: ACCOMMODATION_LINE_TAG },
            },
          });
          await recalcInvoice(tx, stay.invoiceId);
        }
      }
    });

    publish("availability", "stay");
    revalidatePath("/admin/occupancy");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

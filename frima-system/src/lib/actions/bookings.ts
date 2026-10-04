"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { isRoomFree, parseStayRange } from "@/lib/availability";
import { publish } from "@/lib/live/bus";
import {
  fail, int, optionalStr, str, toMessage, type ActionResult,
} from "./shared";

/**
 * A request from the public site. It reserves nothing: the unit stays
 * bookable by anyone until reception confirms, which is what keeps a stranger
 * from blocking the hotel's inventory with a made-up name.
 */
export async function submitBookingRequest(
  form: FormData,
): Promise<ActionResult<{ reference: string }>> {
  try {
    const roomSlug = str(form, "roomSlug");
    const guestName = str(form, "guestName");
    const guestPhone = str(form, "guestPhone");

    if (!guestName) return fail("Le nom est obligatoire.");
    if (!guestPhone) return fail("Un numéro de téléphone est obligatoire.");

    const range = parseStayRange(str(form, "checkIn"), str(form, "checkOut"));

    const room = await prisma.room.findFirst({
      where: { slug: roomSlug, active: true, published: true },
      select: { id: true, capacity: true },
    });
    if (!room) return fail("Cet hébergement n'est pas disponible.");

    const adults = Math.max(int(form, "adults", 1), 1);
    const children = Math.max(int(form, "children", 0), 0);
    if (adults + children > room.capacity) {
      return fail(
        `Cette unité accueille au maximum ${room.capacity} personne(s).`,
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const { formatted } = await nextSequence(
        tx,
        "BOOKING",
        range.checkIn.getFullYear(),
      );
      return tx.bookingRequest.create({
        data: {
          reference: formatted,
          roomId: room.id,
          guestName,
          guestEmail: optionalStr(form, "guestEmail"),
          guestPhone,
          guestCountry: optionalStr(form, "guestCountry"),
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          adults,
          children,
          message: optionalStr(form, "message"),
          status: "PENDING",
        },
      });
    });

    publish("bookings", "created", created.id);
    revalidatePath("/admin/bookings");

    return { ok: true, data: { reference: created.reference } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/**
 * Reception accepts the request: the guest becomes a client, the request
 * becomes a reservation, and the unit leaves public availability.
 */
export async function confirmBookingRequest(
  bookingId: string,
): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUniqueOrThrow({
        where: { id: bookingId },
        include: { room: true },
      });
      if (booking.status !== "PENDING") {
        throw new Error("Cette demande a déjà été traitée.");
      }

      // Re-check now, because the unit may have been sold since the guest asked.
      const free = await isRoomFree(booking.roomId, {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      });
      if (!free) {
        throw new Error("L'unité n'est plus libre sur ces dates.");
      }

      // Match an existing client on phone before creating a duplicate.
      let client = await tx.client.findFirst({
        where: { phone: booking.guestPhone },
      });
      if (!client) {
        const { formatted: code } = await nextSequence(tx, "CLIENT");
        client = await tx.client.create({
          data: {
            code,
            type: "INDIVIDUAL",
            name: booking.guestName,
            phone: booking.guestPhone,
            email: booking.guestEmail,
            country: booking.guestCountry ?? "Cameroun",
            notes: `Réservation en ligne ${booking.reference}`,
          },
        });
      }

      const { formatted: reference } = await nextSequence(
        tx,
        "STAY",
        booking.checkIn.getFullYear(),
      );
      const stay = await tx.stay.create({
        data: {
          reference,
          roomId: booking.roomId,
          clientId: client.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          adults: booking.adults,
          children: booking.children,
          nightlyRate: booking.room.baseRate,
          status: "RESERVED",
          notes: [`Demande en ligne ${booking.reference}`, booking.message]
            .filter(Boolean)
            .join("\n"),
        },
      });

      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          decidedAt: new Date(),
          stayId: stay.id,
          clientId: client.id,
        },
      });
    });

    publish("bookings", "confirmed", bookingId);
    publish("availability", "booked");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/occupancy");
    revalidatePath("/admin/clients");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function declineBookingRequest(
  bookingId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const booking = await prisma.bookingRequest.findUniqueOrThrow({
      where: { id: bookingId },
    });
    if (booking.status !== "PENDING") {
      return fail("Cette demande a déjà été traitée.");
    }

    await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: "DECLINED",
        decidedAt: new Date(),
        declineReason: reason.trim() || null,
      },
    });

    publish("bookings", "declined", bookingId);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/** Lets a guest look their request up from the public site. */
export async function lookupBooking(reference: string): Promise<
  ActionResult<{
    reference: string;
    status: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    nightlyRate: number;
    declineReason: string | null;
  }>
> {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { reference: reference.trim().toUpperCase() },
      include: { room: { select: { name: true, number: true, baseRate: true } } },
    });
    if (!booking) return fail("NOT_FOUND");

    return {
      ok: true,
      data: {
        reference: booking.reference,
        status: booking.status,
        roomName: booking.room.name ?? booking.room.number,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        nightlyRate: booking.room.baseRate,
        declineReason: booking.declineReason,
      },
    };
  } catch (error) {
    return fail(toMessage(error));
  }
}

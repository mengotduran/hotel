import { prisma } from "@/lib/prisma";
import { isRoomFree } from "@/lib/availability";
import { nightsBetween } from "@/lib/actions/shared";
import { BookingsView, type BookingRow } from "@/components/admin/BookingsView";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await prisma.bookingRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      room: { select: { name: true, number: true, slug: true, baseRate: true } },
    },
  });

  // Flag any pending request whose unit has been taken in the meantime, so
  // reception is not offered a Confirm button that is about to fail.
  const rows: BookingRow[] = await Promise.all(
    bookings.map(async (booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestEmail: booking.guestEmail,
      guestCountry: booking.guestCountry,
      roomName: booking.room.name ?? booking.room.number,
      roomSlug: booking.room.slug,
      nightlyRate: booking.room.baseRate,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: nightsBetween(booking.checkIn, booking.checkOut),
      adults: booking.adults,
      children: booking.children,
      message: booking.message,
      createdAt: booking.createdAt.toISOString(),
      declineReason: booking.declineReason,
      stillFree:
        booking.status !== "PENDING"
          ? true
          : await isRoomFree(booking.roomId, {
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
            }),
    })),
  );

  return (
    <BookingsView
      bookings={rows}
      counts={{
        pending: rows.filter((b) => b.status === "PENDING").length,
        confirmed: rows.filter((b) => b.status === "CONFIRMED").length,
        declined: rows.filter((b) => b.status === "DECLINED").length,
      }}
    />
  );
}

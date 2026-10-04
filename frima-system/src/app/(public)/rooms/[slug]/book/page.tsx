import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseStayRange, publicRooms } from "@/lib/availability";
import { isoDay, toCardData } from "@/lib/site";
import { BookingForm } from "@/components/site/BookingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Demande de réservation" };

export default async function BookRoomPage(
  props: PageProps<"/rooms/[slug]/book">,
) {
  const { slug } = await props.params;
  const search = await props.searchParams;

  const range = parseStayRange(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
  );

  const rooms = await publicRooms(range);
  const room = rooms.find((candidate) => candidate.slug === slug);
  if (!room) notFound();

  return (
    <BookingForm
      room={toCardData(room)}
      range={{
        checkIn: isoDay(range.checkIn),
        checkOut: isoDay(range.checkOut),
        nights: range.nights,
      }}
    />
  );
}

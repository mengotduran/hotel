import type { Metadata } from "next";
import { parseStayRange, publicRooms } from "@/lib/availability";
import { isoDay, toCardData } from "@/lib/site";
import { parsePage, pageWindow } from "@/lib/pagination";
import { RoomsBrowser } from "@/components/site/RoomsBrowser";

const PAGE_SIZE = 9;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chambres, studios & appartements",
  description:
    "Disponibilités et tarifs en direct · chambres, studios et appartements meublés à Ntoun, près de l'aéroport de Nsimalen.",
};

export default async function RoomsPage(props: PageProps<"/rooms">) {
  const search = await props.searchParams;

  const range = parseStayRange(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
  );
  const kind = typeof search.kind === "string" ? search.kind : "";
  const freeOnly = search.free === "1";

  const rooms = await publicRooms(range, { kind: kind || undefined });
  const visible = freeOnly
    ? rooms.filter((room) => room.availability === "AVAILABLE")
    : rooms;

  const { page, totalPages, skip, take } = pageWindow(
    parsePage(search.page),
    visible.length,
    PAGE_SIZE,
  );

  return (
    <RoomsBrowser
      rooms={visible.slice(skip, skip + take).map(toCardData)}
      available={visible.filter((room) => room.availability === "AVAILABLE").length}
      page={page}
      totalPages={totalPages}
      range={{
        checkIn: isoDay(range.checkIn),
        checkOut: isoDay(range.checkOut),
        nights: range.nights,
      }}
      kind={kind}
      freeOnly={freeOnly}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseStayRange, publicRooms } from "@/lib/availability";
import { isoDay, toCardData } from "@/lib/site";
import { RoomDetail } from "@/components/site/RoomDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/rooms/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const room = await prisma.room.findFirst({
    where: { slug, published: true, active: true },
    select: { name: true, number: true, headlineFr: true },
  });
  if (!room) return { title: "Hébergement" };
  return {
    title: room.name ?? room.number,
    description: room.headlineFr ?? undefined,
  };
}

export default async function RoomPage(props: PageProps<"/rooms/[slug]">) {
  const { slug } = await props.params;
  const search = await props.searchParams;

  const range = parseStayRange(
    typeof search.from === "string" ? search.from : undefined,
    typeof search.to === "string" ? search.to : undefined,
  );

  const all = await publicRooms(range);
  const room = all.find((candidate) => candidate.slug === slug);
  if (!room) notFound();

  const others = all
    .filter((other) => other.id !== room.id && other.kind === room.kind)
    .slice(0, 3);

  return (
    <RoomDetail
      room={toCardData(room)}
      others={others.map(toCardData)}
      range={{
        checkIn: isoDay(range.checkIn),
        checkOut: isoDay(range.checkOut),
        nights: range.nights,
      }}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { parseStayRange, publicRooms } from "@/lib/availability";
import { isoDay, pagePhotoIds, toCardData } from "@/lib/site";
import { getSettings } from "@/lib/reporting";
import { HomeView, type HomePost } from "@/components/site/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const range = parseStayRange();

  const [rooms, posts, settings, halls] = await Promise.all([
    publicRooms(range),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    getSettings(),
    prisma.room.findMany({
      where: { kind: "HALL", active: true },
      orderBy: { capacity: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  ]);

  // Lead with the units a guest could take tonight.
  const featured = [...rooms]
    .sort((a, b) => {
      if (a.availability !== b.availability) {
        return a.availability === "AVAILABLE" ? -1 : 1;
      }
      return 0;
    })
    .slice(0, 6);

  // The hero runs through the property shots first, then the best unit
  // pictures, so the slideshow shows the place rather than one room twice.
  const exterior = pagePhotoIds(settings, "exterior");
  const heroSlides = [
    ...exterior.map((id) => ({ id, alt: "FRIMA Guest Suites" })),
    ...rooms
      .filter((room) => room.images.length > 0)
      .slice(0, 4)
      .map((room) => ({
        id: room.images[0].id,
        alt: room.name ?? room.number,
      })),
  ].slice(0, 6);

  // One picture per unit for the strip, skipping anything already in the hero.
  const inHero = new Set(heroSlides.map((slide) => slide.id));
  const stripImageIds = rooms
    .flatMap((room) => room.images.slice(0, 1).map((image) => image.id))
    .filter((id) => !inHero.has(id))
    .slice(0, 9);

  // Images for the scroll-synced property tour: one wide "bg" shot and one
  // detail "fg" shot per topic, drawn from real inventory rather than fixed
  // media ids, so a reshoot or a deleted photo can't break the section.
  const diningPhotos = pagePhotoIds(settings, "dining");
  const exteriorPhotos = pagePhotoIds(settings, "exterior");
  const roomShot = rooms.find((r) => r.kind === "ROOM" && r.images.length > 0);
  const apartmentShot = rooms.find((r) => r.kind === "APARTMENT" && r.images.length > 0);

  const tourMedia = {
    rooms: [
      roomShot?.images[0]?.id ?? apartmentShot?.images[0]?.id ?? "",
      apartmentShot?.images[0]?.id ?? roomShot?.images[0]?.id ?? "",
    ] as [string, string],
    dining: [
      diningPhotos[0] ?? "",
      diningPhotos[diningPhotos.length - 1] ?? diningPhotos[0] ?? "",
    ] as [string, string],
    events: [
      halls[0]?.images[0]?.mediaId ?? "",
      halls[1]?.images[0]?.mediaId ?? halls[0]?.images[0]?.mediaId ?? "",
    ] as [string, string],
    location: [
      exteriorPhotos[0] ?? "",
      exteriorPhotos[1] ?? exteriorPhotos[0] ?? "",
    ] as [string, string],
  };
  const tourHalls = halls.map((hall) => ({ name: hall.name ?? hall.number, capacity: hall.capacity }));

  const homePosts: HomePost[] = posts.map((post) => ({
    slug: post.slug,
    titleFr: post.titleFr,
    titleEn: post.titleEn,
    excerptFr: post.excerptFr,
    excerptEn: post.excerptEn,
    category: post.category,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    coverId: post.coverMediaId,
  }));

  return (
    <HomeView
      rooms={featured.map(toCardData)}
      posts={homePosts}
      range={{
        checkIn: isoDay(range.checkIn),
        checkOut: isoDay(range.checkOut),
        nights: range.nights,
      }}
      availableCount={rooms.filter((r) => r.availability === "AVAILABLE").length}
      heroSlides={heroSlides}
      stripImageIds={stripImageIds}
      tourMedia={tourMedia}
      tourHalls={tourHalls}
    />
  );
}

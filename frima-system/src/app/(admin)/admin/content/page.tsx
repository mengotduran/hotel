import { prisma } from "@/lib/prisma";
import { parseAmenities } from "@/lib/amenities";
import { ContentView, type ContentRoom } from "@/components/admin/ContentView";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { kind: "asc" }, { number: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  const data: ContentRoom[] = rooms.map((room) => ({
    id: room.id,
    number: room.number,
    slug: room.slug,
    kind: room.kind,
    name: room.name,
    baseRate: room.baseRate,
    capacity: room.capacity,
    published: room.published,
    featured: room.featured,
    sortOrder: room.sortOrder,
    headlineFr: room.headlineFr,
    headlineEn: room.headlineEn,
    descriptionFr: room.descriptionFr,
    descriptionEn: room.descriptionEn,
    amenities: parseAmenities(room.amenities),
    images: room.images.map((image) => ({
      id: image.id,
      mediaId: image.mediaId,
      sortOrder: image.sortOrder,
    })),
  }));

  return <ContentView rooms={data} />;
}

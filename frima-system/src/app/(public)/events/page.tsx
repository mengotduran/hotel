import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ContentPage } from "@/components/site/ContentPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Séminaires & événements",
  description:
    "Salle de conférence, salles de réunion et espace événementiel à proximité de l'aéroport de Nsimalen.",
};

export default async function EventsPage() {
  const [items, halls] = await Promise.all([
    prisma.serviceItem.findMany({
      where: { active: true, department: { code: "ESP" } },
      orderBy: [{ category: "asc" }, { unitPrice: "desc" }],
    }),
    prisma.room.findMany({
      where: { kind: "HALL", active: true },
      orderBy: { capacity: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
    }),
  ]);

  const capacities = halls
    .map((hall) => `${hall.name ?? hall.number} · ${hall.capacity} places`)
    .join(" · ");

  return (
    <ContentPage
      titleKey="site.events.title"
      leadKey="site.events.lead"
      intro={[
        "FRIMA Guest Suites accueille vos séminaires, assemblées générales, formations et réceptions privées à dix minutes de l'aéroport international de Nsimalen.",
        "Nos espaces sont modulables et équipés pour le travail : sonorisation, vidéoprojection, connexion internet et groupe électrogène de secours.",
        "Les formules séminaire associent la location de l'espace, les pauses-café et la restauration. L'hébergement des participants se réserve dans le même mouvement.",
      ]}
      highlights={[
        { titleKey: "room.capacity", body: capacities || "Capacités sur demande." },
        { titleKey: "site.rooms.amenities", body: "Sonorisation, vidéoprojecteur, Wi-Fi, climatisation, groupe électrogène." },
      ]}
      items={items.map((item) => ({
        code: item.code,
        nameFr: item.nameFr,
        nameEn: item.nameEn,
        unitPrice: item.unitPrice,
        unit: item.unit,
        category: item.category,
      }))}
      itemsTitleKey="site.events.title"
      imageIds={halls.flatMap((hall) => hall.images.map((i) => i.mediaId)).slice(0, 5)}
      ctaHref="/rooms?kind=HALL"
      ctaKey="site.rooms.checkAvailability"
    />
  );
}

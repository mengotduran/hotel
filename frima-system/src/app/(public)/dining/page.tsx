import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ContentPage } from "@/components/site/ContentPage";
import { getSettings } from "@/lib/reporting";
import { pagePhotoIds } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Restauration",
  description:
    "Petit-déjeuner, restaurant et bar à FRIMA Guest Suites, Ntoun, Yaoundé.",
};

export default async function DiningPage() {
  const [items, settings] = await Promise.all([
    prisma.serviceItem.findMany({
      where: { active: true, department: { code: "RES" } },
      orderBy: [{ category: "asc" }, { unitPrice: "asc" }],
    }),
    getSettings(),
  ]);

  const images = pagePhotoIds(settings, "dining");

  return (
    <ContentPage
      titleKey="site.dining.title"
      leadKey="site.dining.lead"
      intro={[
        "Le restaurant de FRIMA Guest Suites sert une cuisine camerounaise et internationale, préparée à la commande à partir de produits frais du marché.",
        "Le petit-déjeuner est servi tous les matins. Le bar reste ouvert en soirée pour les résidents comme pour les visiteurs de passage.",
        "Le service en chambre est disponible aux heures d'ouverture du restaurant : composez le 9 depuis votre unité ou passez à la réception.",
      ]}
      highlights={[
        { titleKey: "site.footer.hours", body: "Petit-déjeuner 6h – 10h · Restaurant 12h – 22h · Bar jusqu'à 23h" },
        { titleKey: "nav.groupOperations", body: "Service en chambre, plateaux-repas pour séminaires et commandes de groupe sur demande." },
      ]}
      items={items.map((item) => ({
        code: item.code,
        nameFr: item.nameFr,
        nameEn: item.nameEn,
        unitPrice: item.unitPrice,
        unit: item.unit,
        category: item.category,
      }))}
      itemsTitleKey="site.dining.title"
      imageIds={images}
      ctaHref="/contact"
      ctaKey="site.home.heroSecondary"
    />
  );
}

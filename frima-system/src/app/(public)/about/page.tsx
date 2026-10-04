import type { Metadata } from "next";
import { ContentPage } from "@/components/site/ContentPage";
import { getSettings } from "@/lib/reporting";
import { pagePhotoIds } from "@/lib/site";

export const metadata: Metadata = {
  title: "L'établissement",
  description:
    "FRIMA Guest Suites, un hébergement familial à Ntoun, près de l'aéroport international de Nsimalen, Yaoundé.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <ContentPage
      titleKey="site.about.title"
      leadKey="site.about.lead"
      intro={[
        "FRIMA Guest Suites est un établissement familial situé à Ntoun, sur l'axe de l'aéroport international de Nsimalen. Sa position en fait une étape naturelle pour les voyageurs en transit comme pour les séjours de travail prolongés à Yaoundé.",
        "L'établissement propose trois formules d'hébergement : des chambres pour les courts séjours, des studios meublés et des appartements pour les séjours longs ou en famille. Toutes les unités disposent d'une salle d'eau privative, de la climatisation et de la connexion internet.",
        "Au-delà de l'hébergement, la maison vit autour de sa restauration et de ses espaces de réunion, qui accueillent aussi bien les résidents que les organisations de passage.",
        "La réception est tenue 24 heures sur 24. Nous organisons sur demande les navettes vers l'aéroport, la blanchisserie et les plateaux-repas.",
      ]}
      highlights={[
        { titleKey: "site.home.statAirport", body: "Environ 10 minutes de route de l'aéroport international de Nsimalen." },
        { titleKey: "site.footer.hours", body: "Réception et accueil assurés jour et nuit, arrivées tardives acceptées." },
        { titleKey: "site.rooms.amenities", body: "Wi-Fi, climatisation, eau chaude, parking, groupe électrogène de secours." },
      ]}
      imageIds={pagePhotoIds(settings, "exterior")}
      ctaHref="/rooms"
      ctaKey="site.home.heroCta"
    />
  );
}

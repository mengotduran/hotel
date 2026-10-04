import type { Metadata } from "next";
import { getSettings } from "@/lib/reporting";
import { ContactView } from "@/components/site/ContactView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Nous joindre · FRIMA Guest Suites, Ntoun, près de l'aéroport de Nsimalen, Yaoundé.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <ContactView
      hotel={{
        name: settings["hotel.name"] ?? "FRIMA Guest Suites",
        address: settings["hotel.address"] ?? "",
        city: settings["hotel.city"] ?? "",
        country: settings["hotel.country"] ?? "",
        phones: settings["hotel.phones"] ?? "",
        email: settings["hotel.email"] ?? "",
      }}
    />
  );
}

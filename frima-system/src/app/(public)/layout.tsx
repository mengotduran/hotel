import { getSettings } from "@/lib/reporting";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  const hotel = {
    name: settings["hotel.name"] ?? "FRIMA Guest Suites",
    tagline: settings["hotel.tagline.fr"] ?? "",
    address: settings["hotel.address"] ?? "",
    city: settings["hotel.city"] ?? "",
    phones: settings["hotel.phones"] ?? "",
  };

  const firstPhone = hotel.phones.split("·")[0]?.trim() ?? "";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader phone={firstPhone} />
      <div className="flex-1">{children}</div>
      <SiteFooter hotel={hotel} />
      <LanguageSwitcher />
    </div>
  );
}

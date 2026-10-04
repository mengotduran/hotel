import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/reporting";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, accounts] = await Promise.all([
    getSettings(),
    prisma.account.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <SettingsView
      settings={settings}
      accounts={accounts.map((a) => ({
        code: a.code,
        nameFr: a.nameFr,
        nameEn: a.nameEn,
        klass: a.klass,
      }))}
    />
  );
}

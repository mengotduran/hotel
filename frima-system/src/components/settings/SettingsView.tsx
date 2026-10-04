"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { saveSettings } from "@/lib/actions/directory";
import { useAction } from "@/components/ui/useAction";
import {
  Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Table, Td, Th,
} from "@/components/ui/Kit";

export function SettingsView({
  settings,
  accounts,
}: {
  settings: Record<string, string>;
  accounts: { code: string; nameFr: string; nameEn: string; klass: number }[];
}) {
  const { t, n } = useI18n();
  const [saved, setSaved] = useState(false);
  const save = useAction(saveSettings, {
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={saved ? <Badge tone="positive">{t("settings.saved")}</Badge> : null}
      />

      <form action={save.run} className="grid gap-4 lg:grid-cols-2">
        <ErrorNote>{save.error}</ErrorNote>

        <Card title={t("settings.hotelName")}>
          <div className="grid gap-4">
            <Field label={t("settings.hotelName")}>
              <Input name="hotel.name" defaultValue={settings["hotel.name"] ?? ""} />
            </Field>
            <Field label="Slogan (FR)">
              <Input name="hotel.tagline.fr" defaultValue={settings["hotel.tagline.fr"] ?? ""} />
            </Field>
            <Field label="Slogan (EN)">
              <Input name="hotel.tagline.en" defaultValue={settings["hotel.tagline.en"] ?? ""} />
            </Field>
            <Field label={t("settings.hotelAddress")}>
              <Input name="hotel.address" defaultValue={settings["hotel.address"] ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("common.city")}>
                <Input name="hotel.city" defaultValue={settings["hotel.city"] ?? ""} />
              </Field>
              <Field label={t("common.country")}>
                <Input name="hotel.country" defaultValue={settings["hotel.country"] ?? ""} />
              </Field>
            </div>
            <Field label={t("settings.hotelPhone")}>
              <Input name="hotel.phones" defaultValue={settings["hotel.phones"] ?? ""} />
            </Field>
            <Field label={t("settings.taxId")} hint={t("common.optional")}>
              <Input name="hotel.taxId" defaultValue={settings["hotel.taxId"] ?? ""} />
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title={t("settings.currency")}>
            <div className="grid gap-4">
              <Field label={t("settings.currency")} hint="XAF (FCFA)">
                <Input name="finance.currency" defaultValue={settings["finance.currency"] ?? "XAF"} />
              </Field>
              <Field
                label={t("settings.vatRate")}
                hint="Cameroun : 17,5 % + 10 % CAC = 19,25 %"
              >
                <Input
                  name="finance.vatRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={settings["finance.vatRate"] ?? "19.25"}
                />
              </Field>
              <Field label={t("settings.tourismTax")} hint={t("common.optional")}>
                <Input
                  name="finance.tourismTaxPerNight"
                  type="number"
                  min={0}
                  defaultValue={settings["finance.tourismTaxPerNight"] ?? "0"}
                />
              </Field>
              <Field label={t("receipt.issuedBy")} hint={t("common.optional")}>
                <Input name="receipt.issuedBy" defaultValue={settings["receipt.issuedBy"] ?? ""} />
              </Field>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="gold" disabled={save.pending}>
              {save.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <Card title={t("acct.chartOfAccounts")} bodyClassName="p-5 pt-3">
          <Table>
            <thead>
              <tr>
                <Th>{t("acct.accountCode")}</Th>
                <Th>{t("acct.account")}</Th>
                <Th align="center">Classe</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.code}>
                  <Td className="tabular font-medium">{account.code}</Td>
                  <Td>{n(account)}</Td>
                  <Td align="center" className="text-muted">{account.klass}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}

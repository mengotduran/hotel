"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { saveClient } from "@/lib/actions/directory";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, Table, Td, Th, Textarea,
} from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { IconPlus, IconSearch } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface ClientRow {
  id: string;
  code: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  billed: number;
  paid: number;
  outstanding: number;
}

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const { t, money } = useI18n();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const save = useAction(saveClient, { onSuccess: () => setCreating(false) });

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? clients.filter((c) =>
        [c.name, c.code, c.phone ?? "", c.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : clients;
  const { page, setPage, totalPages, pageRows } = usePagination(visible, 25);

  const totalOutstanding = clients.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <>
      <PageHeader
        title={t("client.title")}
        subtitle={`${t("client.subtitle")} · ${t("client.outstanding")} ${money(totalOutstanding)}`}
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" />
            {t("client.new")}
          </Button>
        }
      />

      <Card bodyClassName="p-5 pt-4">
        <div className="relative mb-4">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search")}
            className="pl-9"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("common.code")}</Th>
                <Th>{t("common.name")}</Th>
                <Th>{t("common.type")}</Th>
                <Th>{t("common.phone")}</Th>
                <Th align="right">{t("client.billed")}</Th>
                <Th align="right">{t("client.paid")}</Th>
                <Th align="right">{t("client.outstanding")}</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((client) => (
                <tr key={client.id}>
                  <Td className="tabular text-xs text-muted">{client.code}</Td>
                  <Td>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {client.name}
                    </Link>
                    {client.city && (
                      <span className="block text-xs text-muted">{client.city}</span>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {t(`client.type.${client.type}` as MessageKey)}
                  </Td>
                  <Td className="text-muted">{client.phone ?? "—"}</Td>
                  <Td align="right">{money(client.billed)}</Td>
                  <Td align="right">{money(client.paid)}</Td>
                  <Td align="right">
                    {client.outstanding > 0 ? (
                      <Badge tone="negative">{money(client.outstanding)}</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      <Modal
        open={creating}
        title={t("client.new")}
        onClose={() => {
          setCreating(false);
          save.clearError();
        }}
      >
        <form action={save.run} className="space-y-4">
          <ErrorNote>{save.error}</ErrorNote>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("common.name")} *`} className="sm:col-span-2">
              <Input name="name" required />
            </Field>
            <Field label={t("common.type")}>
              <Select name="type" defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">{t("client.type.INDIVIDUAL")}</option>
                <option value="COMPANY">{t("client.type.COMPANY")}</option>
              </Select>
            </Field>
            <Field label={t("client.idNumber")}>
              <Input name="idNumber" />
            </Field>
            <Field label={t("common.phone")}>
              <Input name="phone" />
            </Field>
            <Field label={t("common.email")}>
              <Input name="email" type="email" />
            </Field>
            <Field label={t("common.city")}>
              <Input name="city" />
            </Field>
            <Field label={t("common.country")}>
              <Input name="country" defaultValue="Cameroun" />
            </Field>
            <Field label={t("common.address")} className="sm:col-span-2">
              <Input name="address" />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.pending}>
              {save.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

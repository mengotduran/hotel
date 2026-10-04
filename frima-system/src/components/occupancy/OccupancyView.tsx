"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cancelStay, checkInStay, checkOutStay, createStay } from "@/lib/actions/stays";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, StatTile, Table, Td, Th, Textarea, type BadgeTone,
} from "@/components/ui/Kit";
import { IconPlus } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface StayRow {
  id: string;
  reference: string;
  roomId: string;
  roomNumber: string;
  clientId: string;
  clientName: string;
  checkIn: string;
  checkOut: string;
  nightlyRate: number;
  adults: number;
  children: number;
  status: string;
  invoiceId: string | null;
}

export interface UnitRow {
  id: string;
  number: string;
  kind: string;
  name: string | null;
  baseRate: number;
  status: string;
}

const STAY_TONE: Record<string, BadgeTone> = {
  RESERVED: "info",
  CHECKED_IN: "positive",
  CHECKED_OUT: "neutral",
  CANCELLED: "negative",
  NO_SHOW: "warning",
};

const BOARD_DAYS = 14;

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function OccupancyView({
  units,
  stays,
  clients,
  snapshot,
  today,
}: {
  units: UnitRow[];
  stays: StayRow[];
  clients: { id: string; name: string; code: string }[];
  snapshot: { occupied: number; lettable: number; rate: number; arrivals: number; departures: number; inHouse: number };
  today: string;
}) {
  const { t, money, date } = useI18n();
  const [creating, setCreating] = useState(false);
  const [prefill, setPrefill] = useState<{ roomId: string; day: string } | null>(null);

  const create = useAction(createStay, {
    onSuccess: () => {
      setCreating(false);
      setPrefill(null);
    },
  });
  const checkIn = useAction(checkInStay);
  const checkOut = useAction(checkOutStay);
  const cancel = useAction(cancelStay);

  const days = useMemo(() => {
    const start = new Date(`${today}T00:00:00`);
    return Array.from({ length: BOARD_DAYS }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [today]);

  // A stay colours a cell when that calendar day falls inside its nights.
  const cellFor = useMemo(() => {
    const map = new Map<string, StayRow>();
    for (const stay of stays) {
      if (stay.status === "CANCELLED" || stay.status === "NO_SHOW") continue;
      const from = new Date(`${stay.checkIn.slice(0, 10)}T00:00:00`);
      const to = new Date(`${stay.checkOut.slice(0, 10)}T00:00:00`);
      for (const day of days) {
        if (day >= from && day < to) map.set(`${stay.roomId}|${isoDay(day)}`, stay);
      }
    }
    return map;
  }, [stays, days]);

  const active = stays.filter((s) => s.status === "RESERVED" || s.status === "CHECKED_IN");
  const busy = create.pending || checkIn.pending || checkOut.pending || cancel.pending;

  return (
    <>
      <PageHeader
        title={t("stay.title")}
        subtitle={t("stay.subtitle")}
        actions={
          <Button variant="gold" onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" />
            {t("stay.new")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t("dash.occupancyRate")}
          value={`${(snapshot.rate * 100).toFixed(0)} %`}
          tone="gold"
          hint={`${snapshot.occupied} / ${snapshot.lettable}`}
        />
        <StatTile label={t("dash.inHouse")} value={String(snapshot.inHouse)} />
        <StatTile label={t("dash.arrivalsToday")} value={String(snapshot.arrivals)} />
        <StatTile label={t("dash.departuresToday")} value={String(snapshot.departures)} />
      </div>

      <ErrorNote>{checkIn.error ?? checkOut.error ?? cancel.error}</ErrorNote>

      <div className="mt-6">
        <Card title={t("stay.occupancyBoard")} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-line bg-surface px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t("common.room")}
                  </th>
                  {days.map((day) => {
                    const weekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <th
                        key={day.toISOString()}
                        className={`border-b border-l border-line px-1 py-2 text-center text-[11px] font-medium ${
                          weekend ? "bg-surface-muted text-muted" : "text-muted"
                        }`}
                      >
                        <span className="block tabular text-foreground">{day.getDate()}</span>
                        <span className="block text-[10px]">
                          {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(day)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td className="sticky left-0 z-10 whitespace-nowrap border-b border-line/70 bg-surface px-4 py-2">
                      <span className="font-medium">{unit.number}</span>
                      <span className="ml-2 text-xs text-muted">
                        {t(`room.kind.${unit.kind}` as MessageKey)}
                      </span>
                    </td>
                    {days.map((day) => {
                      const key = `${unit.id}|${isoDay(day)}`;
                      const stay = cellFor.get(key);
                      return (
                        <td
                          key={key}
                          className="border-b border-l border-line/70 p-0.5"
                        >
                          {stay ? (
                            <span
                              title={`${stay.reference} · ${stay.clientName}`}
                              className={`block h-7 rounded px-1 text-[10px] leading-7 ${
                                stay.status === "CHECKED_IN"
                                  ? "bg-navy text-white"
                                  : "bg-[#dce6f3] text-navy"
                              } truncate`}
                            >
                              {stay.clientName}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPrefill({ roomId: unit.id, day: isoDay(day) });
                                setCreating(true);
                              }}
                              aria-label={`${t("stay.new")} ${unit.number}`}
                              className="block h-7 w-full rounded transition-colors hover:bg-gold/20"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title={t("stay.title")} bodyClassName="p-5 pt-3">
          {active.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("common.client")}</Th>
                  <Th>{t("common.room")}</Th>
                  <Th>{t("stay.checkIn")}</Th>
                  <Th>{t("stay.checkOut")}</Th>
                  <Th align="right">{t("stay.nightlyRate")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {active.map((stay) => (
                  <tr key={stay.id}>
                    <Td className="tabular text-xs text-muted">{stay.reference}</Td>
                    <Td className="font-medium">{stay.clientName}</Td>
                    <Td>{stay.roomNumber}</Td>
                    <Td className="whitespace-nowrap text-muted">{date(stay.checkIn)}</Td>
                    <Td className="whitespace-nowrap text-muted">{date(stay.checkOut)}</Td>
                    <Td align="right">{money(stay.nightlyRate)}</Td>
                    <Td>
                      <Badge tone={STAY_TONE[stay.status] ?? "neutral"}>
                        {t(`stay.status.${stay.status}` as MessageKey)}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        {stay.status === "RESERVED" && (
                          <Button
                            variant="primary"
                            disabled={busy}
                            onClick={() => checkIn.run(stay.id)}
                            className="px-2.5 py-1 text-xs"
                          >
                            {t("stay.doCheckIn")}
                          </Button>
                        )}
                        {stay.status === "CHECKED_IN" && (
                          <Button
                            variant="gold"
                            disabled={busy}
                            onClick={() => checkOut.run(stay.id)}
                            className="px-2.5 py-1 text-xs"
                          >
                            {t("stay.doCheckOut")}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() => cancel.run(stay.id, false)}
                          className="px-2.5 py-1 text-xs"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Modal
        open={creating}
        title={t("stay.new")}
        onClose={() => {
          setCreating(false);
          setPrefill(null);
          create.clearError();
        }}
      >
        <form action={create.run} className="space-y-4">
          <ErrorNote>{create.error}</ErrorNote>

          <Field label={`${t("common.client")} *`}>
            <Select name="clientId" required defaultValue="">
              <option value="" disabled>
                {t("common.search")}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </option>
              ))}
            </Select>
          </Field>

          <Field label={`${t("common.room")} *`}>
            <Select name="roomId" required defaultValue={prefill?.roomId ?? ""}>
              <option value="" disabled>
                {t("common.search")}
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.number} · {t(`room.kind.${unit.kind}` as MessageKey)} ({money(unit.baseRate)})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("stay.checkIn")} *`}>
              <Input
                type="date"
                name="checkIn"
                required
                defaultValue={prefill?.day ?? today}
              />
            </Field>
            <Field label={`${t("stay.checkOut")} *`}>
              <Input type="date" name="checkOut" required />
            </Field>
            <Field label={t("stay.adults")}>
              <Input type="number" name="adults" min={1} defaultValue={1} />
            </Field>
            <Field label={t("stay.children")}>
              <Input type="number" name="children" min={0} defaultValue={0} />
            </Field>
            <Field
              label={`${t("stay.nightlyRate")} (FCFA)`}
              hint={t("common.optional")}
              className="sm:col-span-2"
            >
              <Input type="number" name="nightlyRate" min={0} step={500} />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={create.pending}>
              {create.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { saveRoom, setRoomStatus } from "@/lib/actions/directory";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, Table, Td, Th, Textarea, type BadgeTone,
} from "@/components/ui/Kit";
import { IconPlus } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface RoomRow {
  id: string;
  number: string;
  kind: string;
  name: string | null;
  floor: string | null;
  capacity: number;
  baseRate: number;
  status: string;
  notes: string | null;
  active: boolean;
  departmentId: string;
  currentGuest: string | null;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  AVAILABLE: "positive",
  OCCUPIED: "info",
  CLEANING: "warning",
  MAINTENANCE: "warning",
  OUT_OF_SERVICE: "negative",
};

const STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"];
const KINDS = ["ROOM", "STUDIO", "APARTMENT", "HALL"];

export function RoomsView({
  rooms,
  departments,
}: {
  rooms: RoomRow[];
  departments: { id: string; nameFr: string; nameEn: string }[];
}) {
  const { t, n, money } = useI18n();
  const [editing, setEditing] = useState<RoomRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [kindFilter, setKindFilter] = useState("");

  const save = useAction(saveRoom, {
    onSuccess: () => {
      setEditing(null);
      setCreating(false);
    },
  });
  const status = useAction(setRoomStatus);

  const visible = kindFilter ? rooms.filter((r) => r.kind === kindFilter) : rooms;
  const open = creating || editing !== null;

  return (
    <>
      <PageHeader
        title={t("room.title")}
        subtitle={t("room.subtitle")}
        actions={
          <>
            <Select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="w-auto"
              aria-label={t("room.kind")}
            >
              <option value="">{t("common.all")}</option>
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`room.kind.${kind}` as MessageKey)}
                </option>
              ))}
            </Select>
            <Button variant="gold" onClick={() => setCreating(true)}>
              <IconPlus className="h-4 w-4" />
              {t("room.new")}
            </Button>
          </>
        }
      />

      <ErrorNote>{status.error}</ErrorNote>

      <Card bodyClassName="p-5 pt-3">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("room.number")}</Th>
                <Th>{t("room.kind")}</Th>
                <Th>{t("room.floor")}</Th>
                <Th align="center">{t("room.capacity")}</Th>
                <Th align="right">{t("room.baseRate")}</Th>
                <Th>{t("common.status")}</Th>
                <Th align="right">{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((room) => (
                <tr key={room.id} className={room.active ? "" : "opacity-50"}>
                  <Td>
                    <span className="font-medium">{room.number}</span>
                    {room.name && (
                      <span className="block text-xs text-muted">{room.name}</span>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {t(`room.kind.${room.kind}` as MessageKey)}
                  </Td>
                  <Td className="text-muted">{room.floor ?? "—"}</Td>
                  <Td align="center" className="tabular">{room.capacity}</Td>
                  <Td align="right" className="font-medium">
                    {money(room.baseRate)}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge tone={STATUS_TONE[room.status] ?? "neutral"}>
                        {t(`room.status.${room.status}` as MessageKey)}
                      </Badge>
                      {room.currentGuest && (
                        <span className="text-xs text-muted">{room.currentGuest}</span>
                      )}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={room.status}
                        disabled={status.pending}
                        onChange={(e) => status.run(room.id, e.target.value)}
                        className="w-auto py-1 text-xs"
                        aria-label={t("common.status")}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t(`room.status.${s}` as MessageKey)}
                          </option>
                        ))}
                      </Select>
                      <Button variant="ghost" onClick={() => setEditing(room)}>
                        {t("common.edit")}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? `${t("common.edit")} · ${editing.number}` : t("room.new")}
        onClose={() => {
          setEditing(null);
          setCreating(false);
          save.clearError();
        }}
      >
        <form action={save.run} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <ErrorNote>{save.error}</ErrorNote>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("room.number")} *`}>
              <Input name="number" defaultValue={editing?.number} required />
            </Field>
            <Field label={`${t("room.kind")} *`}>
              <Select name="kind" defaultValue={editing?.kind ?? "ROOM"}>
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`room.kind.${kind}` as MessageKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.name")} className="sm:col-span-2">
              <Input name="name" defaultValue={editing?.name ?? ""} />
            </Field>
            <Field label={`${t("common.department")} *`}>
              <Select name="departmentId" defaultValue={editing?.departmentId}>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {n(dept)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("room.floor")}>
              <Input name="floor" defaultValue={editing?.floor ?? ""} />
            </Field>
            <Field label={t("room.capacity")}>
              <Input
                name="capacity"
                type="number"
                min={1}
                defaultValue={editing?.capacity ?? 2}
              />
            </Field>
            <Field label={`${t("room.baseRate")} (FCFA)`}>
              <Input
                name="baseRate"
                type="number"
                min={0}
                step={500}
                defaultValue={editing?.baseRate ?? 0}
              />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing?.active ?? true}
              className="h-4 w-4 rounded border-line"
            />
            {t("common.active")}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
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

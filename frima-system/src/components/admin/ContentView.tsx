"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  deleteRoomPhoto, moveRoomPhoto, saveRoomContent, uploadRoomPhoto,
} from "@/lib/actions/website";
import { AMENITY_CODES } from "@/lib/amenities";
import { useAction } from "@/components/ui/useAction";
import {
  Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Select, StatTile,
  Textarea,
} from "@/components/ui/Kit";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface ContentRoom {
  id: string;
  number: string;
  slug: string;
  kind: string;
  name: string | null;
  baseRate: number;
  capacity: number;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  headlineFr: string | null;
  headlineEn: string | null;
  descriptionFr: string | null;
  descriptionEn: string | null;
  amenities: string[];
  images: { id: string; mediaId: string; sortOrder: number }[];
}

function PhotoManager({ room }: { room: ContentRoom }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useAction(deleteRoomPhoto);
  const move = useAction(moveRoomPhoto);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.set("roomId", room.id);
    form.set("file", file);

    const result = await uploadRoomPhoto(form);
    setUploading(false);
    if (!result.ok) setError(result.error);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          {t("content.photos")} ({room.images.length})
        </h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-2.5 py-1 text-xs"
          >
            {uploading ? t("content.uploading") : t("content.addPhoto")}
          </Button>
        </div>
      </div>

      <ErrorNote>{error ?? remove.error ?? move.error}</ErrorNote>

      {room.images.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-line py-8 text-center text-xs text-muted">
          {t("site.rooms.noPhoto")}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {room.images.map((image, index) => (
            <li
              key={image.id}
              className="group relative overflow-hidden rounded-lg border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/${image.mediaId}`}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5">
                  <Badge tone="gold">1</Badge>
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  disabled={index === 0 || move.pending}
                  onClick={() => move.run(image.id, "up")}
                  aria-label="←"
                  className="rounded px-2 py-0.5 text-xs text-white hover:bg-white/20 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={index === room.images.length - 1 || move.pending}
                  onClick={() => move.run(image.id, "down")}
                  aria-label="→"
                  className="rounded px-2 py-0.5 text-xs text-white hover:bg-white/20 disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={remove.pending}
                  onClick={() => remove.run(image.id)}
                  aria-label={t("common.delete")}
                  className="rounded px-2 py-0.5 text-xs text-white hover:bg-negative/80"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoomEditor({ room }: { room: ContentRoom }) {
  const { t, money } = useI18n();
  const [saved, setSaved] = useState(false);

  const save = useAction(saveRoomContent, {
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const name = room.name ?? room.number;

  return (
    <Card
      title={`${room.number} · ${name}`}
      subtitle={`${t(`room.kind.${room.kind}` as MessageKey)} · ${money(room.baseRate)}`}
      actions={
        <div className="flex items-center gap-2">
          {saved && <Badge tone="positive">{t("settings.saved")}</Badge>}
          <Badge tone={room.published ? "positive" : "neutral"}>
            {t(room.published ? "content.published" : "content.unpublished")}
          </Badge>
          {room.published && (
            <Link
              href={`/rooms/${room.slug}`}
              target="_blank"
              className="text-xs font-medium text-info hover:underline"
            >
              ↗
            </Link>
          )}
        </div>
      }
    >
      <form action={save.run} className="space-y-5">
        <input type="hidden" name="id" value={room.id} />
        <ErrorNote>{save.error}</ErrorNote>

        <PhotoManager room={room} />

        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Field label={`${t("room.baseRate")} (FCFA)`} hint={t("content.liveNote")}>
            <Input
              name="baseRate"
              type="number"
              min={0}
              step={500}
              defaultValue={room.baseRate}
            />
          </Field>
          <Field label={t("content.slug")} hint={`/rooms/${room.slug}`}>
            <Input name="slug" defaultValue={room.slug} />
          </Field>
          <Field label={`${t("content.headline")} (FR)`}>
            <Input name="headlineFr" defaultValue={room.headlineFr ?? ""} />
          </Field>
          <Field label={`${t("content.headline")} (EN)`}>
            <Input name="headlineEn" defaultValue={room.headlineEn ?? ""} />
          </Field>
          <Field label={`${t("content.description")} (FR)`}>
            <Textarea
              name="descriptionFr"
              rows={4}
              defaultValue={room.descriptionFr ?? ""}
            />
          </Field>
          <Field label={`${t("content.description")} (EN)`}>
            <Textarea
              name="descriptionEn"
              rows={4}
              defaultValue={room.descriptionEn ?? ""}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium">
            {t("content.amenitiesLabel")}
          </legend>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {AMENITY_CODES.map((code) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`amenity.${code}`}
                  defaultChecked={room.amenities.includes(code)}
                  className="h-4 w-4 rounded border-line"
                />
                <span className="truncate">{t(`amenity.${code}` as MessageKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-5 border-t border-line pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={room.published}
              className="h-4 w-4 rounded border-line"
            />
            {t("content.published")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={room.featured}
              className="h-4 w-4 rounded border-line"
            />
            {t("content.featured")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">#</span>
            <Input
              name="sortOrder"
              type="number"
              defaultValue={room.sortOrder}
              className="w-20 py-1"
            />
          </label>

          <Button type="submit" disabled={save.pending} className="ml-auto">
            {save.pending ? t("common.saving") : t("content.saveAndPublish")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ContentView({ rooms }: { rooms: ContentRoom[] }) {
  const { t } = useI18n();
  const [kind, setKind] = useState("");

  const visible = kind ? rooms.filter((room) => room.kind === kind) : rooms;
  const published = rooms.filter((room) => room.published).length;
  const withPhotos = rooms.filter((room) => room.images.length > 0).length;

  return (
    <>
      <PageHeader
        title={t("content.title")}
        subtitle={t("content.subtitle")}
        actions={
          <>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-auto"
              aria-label={t("room.kind")}
            >
              <option value="">{t("common.all")}</option>
              {["ROOM", "STUDIO", "APARTMENT", "HALL"].map((code) => (
                <option key={code} value={code}>
                  {t(`room.kind.${code}` as MessageKey)}
                </option>
              ))}
            </Select>
            <Link
              href="/"
              target="_blank"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              {t("site.nav.home")} ↗
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("content.published")} value={`${published} / ${rooms.length}`} tone="positive" />
        <StatTile label={t("content.photos")} value={`${withPhotos} / ${rooms.length}`} />
        <StatTile label={t("nav.rooms")} value={String(rooms.length)} />
      </div>

      <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
        {t("content.liveNote")}
      </p>

      <div className="mt-5 space-y-4">
        {visible.map((room) => (
          <RoomEditor key={room.id} room={room} />
        ))}
      </div>
    </>
  );
}

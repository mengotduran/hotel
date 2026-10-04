import type { PublicRoom } from "@/lib/availability";
import type { RoomCardData } from "@/components/site/RoomCard";

/** Dates cross the server/client boundary as strings. */
export function toCardData(room: PublicRoom): RoomCardData {
  return { ...room, freeFrom: room.freeFrom?.toISOString() ?? null };
}

export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ids of the page-level photographs stored by the import script. */
export function pagePhotoIds(
  settings: Record<string, string>,
  key: "dining" | "exterior",
): string[] {
  return (settings[`site.photos.${key}`] ?? "").split(",").filter(Boolean);
}

import { prisma } from "@/lib/prisma";
import { nightsBetween, startOfDay } from "@/lib/actions/shared";
import { parseAmenities } from "@/lib/amenities";

/**
 * Availability as the public site presents it. A unit is bookable for a date
 * range when it is published, in service, and carries no overlapping stay.
 *
 * Pending booking requests deliberately do NOT block: reception confirms
 * them, so until then the unit stays open to everyone. That is the whole
 * point of a request-to-book flow.
 */

export const BLOCKING_STAY_STATUSES = ["RESERVED", "CHECKED_IN"];
export const SERVICEABLE_ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING"];

export type RoomAvailability = "AVAILABLE" | "BOOKED" | "UNAVAILABLE";

export interface DateRange {
  checkIn: Date;
  checkOut: Date;
}

/** Parses `?from=&to=` into a sane range, defaulting to tonight. */
export function parseStayRange(
  from?: string,
  to?: string,
): DateRange & { nights: number } {
  const today = startOfDay(new Date());

  let checkIn = from ? new Date(`${from}T00:00:00`) : today;
  if (Number.isNaN(checkIn.getTime())) checkIn = today;
  if (checkIn < today) checkIn = today;

  const defaultOut = new Date(checkIn);
  defaultOut.setDate(defaultOut.getDate() + 1);

  let checkOut = to ? new Date(`${to}T00:00:00`) : defaultOut;
  if (Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    checkOut = defaultOut;
  }

  return { checkIn, checkOut, nights: nightsBetween(checkIn, checkOut) };
}

export interface PublicRoom {
  id: string;
  slug: string;
  number: string;
  kind: string;
  name: string | null;
  capacity: number;
  baseRate: number;
  headlineFr: string | null;
  headlineEn: string | null;
  descriptionFr: string | null;
  descriptionEn: string | null;
  amenities: string[];
  images: { id: string; altFr: string | null; altEn: string | null }[];
  departmentCode: string;
  availability: RoomAvailability;
  /** Set when the unit is taken · the day it frees up again. */
  freeFrom: Date | null;
}

export async function publicRooms(
  range: DateRange,
  options: { kind?: string; onlyFeatured?: boolean; limit?: number } = {},
): Promise<PublicRoom[]> {
  const rooms = await prisma.room.findMany({
    where: {
      active: true,
      published: true,
      ...(options.kind ? { kind: options.kind } : {}),
      ...(options.onlyFeatured ? { featured: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { baseRate: "asc" }, { number: "asc" }],
    ...(options.limit ? { take: options.limit } : {}),
    include: {
      department: { select: { code: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        include: { media: { select: { id: true, altFr: true, altEn: true } } },
      },
    },
  });

  if (rooms.length === 0) return [];

  const clashes = await prisma.stay.findMany({
    where: {
      roomId: { in: rooms.map((r) => r.id) },
      status: { in: BLOCKING_STAY_STATUSES },
      checkIn: { lt: range.checkOut },
      checkOut: { gt: range.checkIn },
    },
    select: { roomId: true, checkOut: true },
  });

  const busyUntil = new Map<string, Date>();
  for (const clash of clashes) {
    const current = busyUntil.get(clash.roomId);
    if (!current || clash.checkOut > current) {
      busyUntil.set(clash.roomId, clash.checkOut);
    }
  }

  return rooms.map((room) => {
    const taken = busyUntil.get(room.id);
    const serviceable = SERVICEABLE_ROOM_STATUSES.includes(room.status);

    const availability: RoomAvailability = !serviceable
      ? "UNAVAILABLE"
      : taken
        ? "BOOKED"
        : "AVAILABLE";

    return {
      id: room.id,
      slug: room.slug,
      number: room.number,
      kind: room.kind,
      name: room.name,
      capacity: room.capacity,
      baseRate: room.baseRate,
      headlineFr: room.headlineFr,
      headlineEn: room.headlineEn,
      descriptionFr: room.descriptionFr,
      descriptionEn: room.descriptionEn,
      amenities: parseAmenities(room.amenities),
      images: room.images.map((image) => ({
        id: image.media.id,
        altFr: image.media.altFr,
        altEn: image.media.altEn,
      })),
      departmentCode: room.department.code,
      availability,
      freeFrom: taken ?? null,
    };
  });
}

export async function publicRoomBySlug(
  slug: string,
  range: DateRange,
): Promise<PublicRoom | null> {
  const room = await prisma.room.findFirst({
    where: { slug, active: true, published: true },
    select: { kind: true },
  });
  if (!room) return null;

  const all = await publicRooms(range, { kind: room.kind });
  return all.find((candidate) => candidate.slug === slug) ?? null;
}

/** Re-checks one unit at confirmation time, when it actually matters. */
export async function isRoomFree(
  roomId: string,
  range: DateRange,
  excludeStayId?: string,
): Promise<boolean> {
  const clash = await prisma.stay.findFirst({
    where: {
      roomId,
      status: { in: BLOCKING_STAY_STATUSES },
      checkIn: { lt: range.checkOut },
      checkOut: { gt: range.checkIn },
      ...(excludeStayId ? { NOT: { id: excludeStayId } } : {}),
    },
    select: { id: true },
  });
  return clash === null;
}

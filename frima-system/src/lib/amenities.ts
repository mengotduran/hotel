/**
 * Amenity codes shown on the public site and ticked in the admin.
 *
 * Kept in a plain module on purpose: a `"use server"` file may only export
 * async functions, so a constant exported from one is replaced by an action
 * reference in the client bundle.
 */
export const AMENITY_CODES = [
  "WIFI", "AC", "TV", "FRIDGE", "KITCHEN", "BATHROOM", "HOT_WATER", "DESK",
  "BALCONY", "PARKING", "BREAKFAST", "LAUNDRY", "SHUTTLE", "SAFE",
  "PROJECTOR", "SOUND", "GENERATOR",
] as const;

export type AmenityCode = (typeof AMENITY_CODES)[number];

/** Parses the JSON array stored on Room.amenities, tolerating bad data. */
export function parseAmenities(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

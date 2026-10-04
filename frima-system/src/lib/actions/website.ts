"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/live/bus";
import { slugify, uniqueSlug } from "@/lib/slug";
import { AMENITY_CODES } from "@/lib/amenities";
import {
  extensionFor, imageSize, MAX_UPLOAD_BYTES, removeUpload, saveUpload,
} from "@/lib/media/storage";
import {
  bool, fail, int, money, optionalStr, str, toMessage, type ActionResult,
} from "./shared";

const POST_CATEGORIES = ["NEWS", "ROOMS", "OFFERS", "EVENTS"];

/** Everything a guest sees about a unit, plus the price, in one save. */
export async function saveRoomContent(form: FormData): Promise<ActionResult> {
  try {
    const id = str(form, "id");
    if (!id) return fail("Unité introuvable.");

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) return fail("Unité introuvable.");

    const taken = (
      await prisma.room.findMany({
        where: { NOT: { id } },
        select: { slug: true },
      })
    ).map((row) => row.slug);

    const requested = optionalStr(form, "slug");
    const slug =
      requested && slugify(requested) !== existing.slug
        ? uniqueSlug(requested, taken)
        : existing.slug;

    const amenities = AMENITY_CODES.filter((code) => form.has(`amenity.${code}`));
    const rate = money(form, "baseRate");

    // Only touch a field when the form actually carried it. The real admin
    // form always submits the full set, but a caller sending a partial form
    // (a price-only update, say) must not blank out the rest as a side effect.
    await prisma.room.update({
      where: { id },
      data: {
        slug,
        // Checkboxes: an unchecked box is legitimately absent from the form,
        // so presence/absence IS the signal here, unlike the text fields below.
        published: bool(form, "published"),
        featured: bool(form, "featured"),
        ...(form.has("headlineFr") ? { headlineFr: optionalStr(form, "headlineFr") } : {}),
        ...(form.has("headlineEn") ? { headlineEn: optionalStr(form, "headlineEn") } : {}),
        ...(form.has("descriptionFr") ? { descriptionFr: optionalStr(form, "descriptionFr") } : {}),
        ...(form.has("descriptionEn") ? { descriptionEn: optionalStr(form, "descriptionEn") } : {}),
        ...(Array.from(form.keys()).some((k) => k.startsWith("amenity."))
          ? { amenities: JSON.stringify(amenities) }
          : {}),
        sortOrder: int(form, "sortOrder", existing.sortOrder),
        ...(rate > 0 ? { baseRate: rate } : {}),
      },
    });

    // The price and the listing are what guests have on screen right now.
    publish("rooms", "updated", id);
    if (rate > 0 && rate !== existing.baseRate) publish("rooms", "price", id);

    revalidatePath("/admin/content");
    revalidatePath("/admin/rooms");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function uploadRoomPhoto(form: FormData): Promise<ActionResult> {
  try {
    const roomId = str(form, "roomId");
    const file = form.get("file");

    if (!roomId) return fail("Unité introuvable.");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Aucun fichier sélectionné.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return fail(
        `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). Maximum 6 Mo.`,
      );
    }
    if (!extensionFor(file.type)) {
      return fail("Format non supporté. Utilisez JPEG, PNG, WebP ou AVIF.");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dimensions = imageSize(bytes);

    const media = await prisma.media.create({
      data: {
        filename: file.name.slice(0, 180),
        mimeType: file.type,
        size: bytes.length,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        altFr: optionalStr(form, "altFr"),
        altEn: optionalStr(form, "altEn"),
      },
    });

    // Write the file only once the row exists, so an orphan file is impossible.
    await saveUpload(media.id, media.mimeType, bytes);

    const last = await prisma.roomImage.findFirst({
      where: { roomId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.roomImage.create({
      data: {
        roomId,
        mediaId: media.id,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    publish("rooms", "photo", roomId);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function deleteRoomPhoto(roomImageId: string): Promise<ActionResult> {
  try {
    const image = await prisma.roomImage.findUnique({
      where: { id: roomImageId },
      include: { media: true },
    });
    if (!image) return { ok: true };

    await prisma.roomImage.delete({ where: { id: roomImageId } });

    // Only drop the file when nothing else points at it.
    const stillUsed = await prisma.roomImage.count({
      where: { mediaId: image.mediaId },
    });
    const usedAsCover = await prisma.post.count({
      where: { coverMediaId: image.mediaId },
    });
    if (stillUsed === 0 && usedAsCover === 0) {
      await prisma.media.delete({ where: { id: image.mediaId } });
      await removeUpload(image.media.id, image.media.mimeType);
    }

    publish("rooms", "photo", image.roomId);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function moveRoomPhoto(
  roomImageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    const image = await prisma.roomImage.findUnique({ where: { id: roomImageId } });
    if (!image) return fail("Photo introuvable.");

    const neighbour = await prisma.roomImage.findFirst({
      where: {
        roomId: image.roomId,
        sortOrder:
          direction === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbour) return { ok: true };

    await prisma.$transaction([
      prisma.roomImage.update({
        where: { id: image.id },
        data: { sortOrder: neighbour.sortOrder },
      }),
      prisma.roomImage.update({
        where: { id: neighbour.id },
        data: { sortOrder: image.sortOrder },
      }),
    ]);

    publish("rooms", "photo", image.roomId);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export async function savePost(form: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const id = optionalStr(form, "id");
    const titleFr = str(form, "titleFr");
    if (!titleFr) return fail("Le titre est obligatoire.");

    const category = POST_CATEGORIES.includes(str(form, "category"))
      ? str(form, "category")
      : "NEWS";
    const published = bool(form, "published");

    const taken = (
      await prisma.post.findMany({
        where: id ? { NOT: { id } } : {},
        select: { slug: true },
      })
    ).map((row) => row.slug);

    const data = {
      titleFr,
      titleEn: str(form, "titleEn") || titleFr,
      excerptFr: optionalStr(form, "excerptFr"),
      excerptEn: optionalStr(form, "excerptEn"),
      bodyFr: str(form, "bodyFr"),
      bodyEn: str(form, "bodyEn") || str(form, "bodyFr"),
      category,
      authorName: optionalStr(form, "authorName"),
      coverMediaId: optionalStr(form, "coverMediaId"),
      published,
    };

    let postId: string;

    if (id) {
      const existing = await prisma.post.findUniqueOrThrow({ where: { id } });
      const requested = optionalStr(form, "slug");
      const slug =
        requested && slugify(requested) !== existing.slug
          ? uniqueSlug(requested, taken)
          : existing.slug;

      await prisma.post.update({
        where: { id },
        data: {
          ...data,
          slug,
          // Stamp the publication date the first time it goes live.
          publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
        },
      });
      postId = id;
    } else {
      const created = await prisma.post.create({
        data: {
          ...data,
          slug: uniqueSlug(optionalStr(form, "slug") || titleFr, taken),
          publishedAt: published ? new Date() : null,
        },
      });
      postId = created.id;
    }

    publish("blog", published ? "published" : "saved", postId);
    revalidatePath("/admin/blog");
    return { ok: true, data: { id: postId } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function uploadPostCover(form: FormData): Promise<ActionResult<{ mediaId: string }>> {
  try {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Aucun fichier sélectionné.");
    }
    if (file.size > MAX_UPLOAD_BYTES) return fail("Fichier trop volumineux (max 6 Mo).");
    if (!extensionFor(file.type)) return fail("Format non supporté.");

    const bytes = Buffer.from(await file.arrayBuffer());
    const dimensions = imageSize(bytes);

    const media = await prisma.media.create({
      data: {
        filename: file.name.slice(0, 180),
        mimeType: file.type,
        size: bytes.length,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
      },
    });
    await saveUpload(media.id, media.mimeType, bytes);

    const postId = optionalStr(form, "postId");
    if (postId) {
      await prisma.post.update({
        where: { id: postId },
        data: { coverMediaId: media.id },
      });
      publish("blog", "saved", postId);
    }

    revalidatePath("/admin/blog");
    return { ok: true, data: { mediaId: media.id } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  try {
    await prisma.post.delete({ where: { id: postId } });
    publish("blog", "deleted", postId);
    revalidatePath("/admin/blog");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function setPostPublished(
  postId: string,
  published: boolean,
): Promise<ActionResult> {
  try {
    const existing = await prisma.post.findUniqueOrThrow({ where: { id: postId } });
    await prisma.post.update({
      where: { id: postId },
      data: {
        published,
        publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
      },
    });
    publish("blog", published ? "published" : "unpublished", postId);
    revalidatePath("/admin/blog");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

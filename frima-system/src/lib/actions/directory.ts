"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { uniqueSlug } from "@/lib/slug";
import { publish } from "@/lib/live/bus";
import {
  bool, fail, int, money, optionalStr, str, toMessage,
  type ActionResult,
} from "./shared";

// --- Rooms and spaces ------------------------------------------------------

const ROOM_KINDS = ["ROOM", "STUDIO", "APARTMENT", "HALL"];
const ROOM_STATUSES = [
  "AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE",
];

export async function saveRoom(form: FormData): Promise<ActionResult> {
  try {
    const id = optionalStr(form, "id");
    const number = str(form, "number");
    const kind = str(form, "kind");
    const departmentId = str(form, "departmentId");

    if (!number) return fail("Le numéro de l'unité est obligatoire.");
    if (!ROOM_KINDS.includes(kind)) return fail("Type d'unité invalide.");
    if (!departmentId) return fail("Le département est obligatoire.");

    const clash = await prisma.room.findFirst({
      where: { number, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) return fail(`L'unité « ${number} » existe déjà.`);

    const label = optionalStr(form, "name");
    const existingSlugs = (
      await prisma.room.findMany({
        where: id ? { NOT: { id } } : {},
        select: { slug: true },
      })
    ).map((row) => row.slug);

    const requested = optionalStr(form, "slug");
    const slug = uniqueSlug(
      requested || `${label ?? ""} ${number}`.trim() || number,
      existingSlugs,
    );

    const data = {
      number,
      slug,
      kind,
      name: label,
      floor: optionalStr(form, "floor"),
      capacity: Math.max(int(form, "capacity", 1), 1),
      baseRate: Math.max(money(form, "baseRate"), 0),
      departmentId,
      notes: optionalStr(form, "notes"),
      active: bool(form, "active"),
    };

    if (id) {
      await prisma.room.update({ where: { id }, data });
    } else {
      await prisma.room.create({ data });
    }

    // A new unit, a renamed one or a new rate all change what guests see.
    publish("rooms", "saved");

    revalidatePath("/admin/rooms");
    revalidatePath("/admin/occupancy");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function setRoomStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    if (!ROOM_STATUSES.includes(status)) return fail("Statut invalide.");

    // A unit with someone in it cannot be marked free by hand; the stay has
    // to be closed first, otherwise the board and the folio disagree.
    if (status !== "OCCUPIED") {
      const occupied = await prisma.stay.findFirst({
        where: { roomId: id, status: "CHECKED_IN" },
        select: { reference: true },
      });
      if (occupied) {
        return fail(
          `Séjour ${occupied.reference} en cours sur cette unité · enregistrez le départ d'abord.`,
        );
      }
    }

    await prisma.room.update({ where: { id }, data: { status } });

    // Taking a unit out of service removes it from public availability.
    publish("availability", "status", id);

    revalidatePath("/admin/rooms");
    revalidatePath("/admin/occupancy");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// --- Clients ---------------------------------------------------------------

export async function saveClient(form: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const id = optionalStr(form, "id");
    const name = str(form, "name");
    if (!name) return fail("Le nom du client est obligatoire.");

    const type = str(form, "type") === "COMPANY" ? "COMPANY" : "INDIVIDUAL";
    const data = {
      type,
      name,
      phone: optionalStr(form, "phone"),
      email: optionalStr(form, "email"),
      idNumber: optionalStr(form, "idNumber"),
      address: optionalStr(form, "address"),
      city: optionalStr(form, "city"),
      country: str(form, "country") || "Cameroun",
      notes: optionalStr(form, "notes"),
      active: form.has("active") ? bool(form, "active") : true,
    };

    if (id) {
      await prisma.client.update({ where: { id }, data });
      revalidatePath("/admin/clients");
      revalidatePath(`/admin/clients/${id}`);
      return { ok: true, data: { id } };
    }

    const created = await prisma.$transaction(async (tx) => {
      const { formatted } = await nextSequence(tx, "CLIENT");
      return tx.client.create({ data: { ...data, code: formatted } });
    });

    revalidatePath("/admin/clients");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// --- Suppliers -------------------------------------------------------------

export async function saveSupplier(form: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const id = optionalStr(form, "id");
    const name = str(form, "name");
    if (!name) return fail("Le nom du fournisseur est obligatoire.");

    const data = {
      name,
      phone: optionalStr(form, "phone"),
      email: optionalStr(form, "email"),
      address: optionalStr(form, "address"),
      notes: optionalStr(form, "notes"),
      active: form.has("active") ? bool(form, "active") : true,
    };

    if (id) {
      await prisma.supplier.update({ where: { id }, data });
      revalidatePath("/admin/suppliers");
      return { ok: true, data: { id } };
    }

    const created = await prisma.$transaction(async (tx) => {
      const { formatted } = await nextSequence(tx, "SUPPLIER");
      return tx.supplier.create({ data: { ...data, code: formatted } });
    });

    revalidatePath("/admin/suppliers");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// --- Service items ---------------------------------------------------------

export async function saveServiceItem(form: FormData): Promise<ActionResult> {
  try {
    const id = optionalStr(form, "id");
    const code = str(form, "code").toUpperCase();
    const nameFr = str(form, "nameFr");
    const departmentId = str(form, "departmentId");

    if (!code) return fail("Le code de la prestation est obligatoire.");
    if (!nameFr) return fail("Le libellé est obligatoire.");
    if (!departmentId) return fail("Le département est obligatoire.");

    const clash = await prisma.serviceItem.findFirst({
      where: { code, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) return fail(`Le code « ${code} » est déjà utilisé.`);

    const data = {
      code,
      nameFr,
      nameEn: str(form, "nameEn") || nameFr,
      departmentId,
      category: optionalStr(form, "category"),
      unitPrice: Math.max(money(form, "unitPrice"), 0),
      unit: str(form, "unit") || "unité",
      taxable: bool(form, "taxable"),
      active: form.has("active") ? bool(form, "active") : true,
    };

    if (id) {
      await prisma.serviceItem.update({ where: { id }, data });
    } else {
      await prisma.serviceItem.create({ data });
    }

    revalidatePath("/admin/departments");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

// --- Settings --------------------------------------------------------------

export async function saveSettings(form: FormData): Promise<ActionResult> {
  try {
    const entries: [string, string][] = [];
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && key.includes(".")) {
        entries.push([key, value.trim()]);
      }
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

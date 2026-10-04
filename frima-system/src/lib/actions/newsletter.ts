"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fail, str, toMessage, type ActionResult } from "./shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up from the footer. Re-submitting the same address updates
 * the name on file instead of failing — someone fixing a typo in their name
 * should not have to know their email is already registered.
 */
export async function subscribeNewsletter(
  form: FormData,
): Promise<ActionResult> {
  try {
    const firstName = str(form, "firstName");
    const lastName = str(form, "lastName");
    const email = str(form, "email").toLowerCase();

    if (!firstName) return fail("Le prénom est obligatoire.");
    if (!lastName) return fail("Le nom est obligatoire.");
    if (!EMAIL_RE.test(email)) return fail("L'adresse e-mail n'est pas valide.");

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { firstName, lastName, email },
      update: { firstName, lastName },
    });

    revalidatePath("/admin/newsletter");
    return { ok: true };
  } catch (error) {
    return fail(toMessage(error));
  }
}

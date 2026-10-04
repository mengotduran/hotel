import { prisma } from "@/lib/prisma";
import { NewsletterView, type SubscriberRow } from "@/components/admin/NewsletterView";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: SubscriberRow[] = subscribers.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    createdAt: s.createdAt.toISOString(),
  }));

  return <NewsletterView subscribers={rows} />;
}

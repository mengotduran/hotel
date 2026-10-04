import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostView } from "@/components/site/PostView";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: { titleFr: true, excerptFr: true },
  });
  if (!post) return { title: "Actualité" };
  return { title: post.titleFr, description: post.excerptFr ?? undefined };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;

  const post = await prisma.post.findFirst({ where: { slug, published: true } });
  if (!post) notFound();

  return (
    <PostView
      post={{
        titleFr: post.titleFr,
        titleEn: post.titleEn,
        bodyFr: post.bodyFr,
        bodyEn: post.bodyEn,
        excerptFr: post.excerptFr,
        excerptEn: post.excerptEn,
        category: post.category,
        authorName: post.authorName,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        coverId: post.coverMediaId,
      }}
    />
  );
}

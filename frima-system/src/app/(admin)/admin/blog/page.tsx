import { prisma } from "@/lib/prisma";
import { BlogView, type PostRow } from "@/components/admin/BlogView";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: [{ published: "desc" }, { updatedAt: "desc" }],
  });

  const rows: PostRow[] = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    titleFr: post.titleFr,
    titleEn: post.titleEn,
    excerptFr: post.excerptFr,
    excerptEn: post.excerptEn,
    bodyFr: post.bodyFr,
    bodyEn: post.bodyEn,
    category: post.category,
    authorName: post.authorName,
    coverMediaId: post.coverMediaId,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    updatedAt: post.updatedAt.toISOString(),
  }));

  return <BlogView posts={rows} />;
}

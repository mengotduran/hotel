import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseStayRange, publicRooms } from "@/lib/availability";
import { isoDay, toCardData } from "@/lib/site";
import { parsePage, pageWindow } from "@/lib/pagination";
import { BlogIndex } from "@/components/site/BlogIndex";
import type { HomePost } from "@/components/site/HomeView";

const PAGE_SIZE = 9;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Nouvelles, offres et mises à jour de FRIMA Guest Suites.",
};

export default async function BlogPage(props: PageProps<"/blog">) {
  const search = await props.searchParams;
  const category = typeof search.category === "string" ? search.category : "";
  const range = parseStayRange();

  const where = { published: true, ...(category ? { category } : {}) };
  const totalPosts = await prisma.post.count({ where });
  const { page, totalPages, skip, take } = pageWindow(
    parsePage(search.page),
    totalPosts,
    PAGE_SIZE,
  );

  const [posts, rooms] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
    }),
    publicRooms(range),
  ]);

  const items: HomePost[] = posts.map((post) => ({
    slug: post.slug,
    titleFr: post.titleFr,
    titleEn: post.titleEn,
    excerptFr: post.excerptFr,
    excerptEn: post.excerptEn,
    category: post.category,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    coverId: post.coverMediaId,
  }));

  return (
    <BlogIndex
      posts={items}
      page={page}
      totalPages={totalPages}
      rooms={rooms.map(toCardData)}
      range={{
        checkIn: isoDay(range.checkIn),
        checkOut: isoDay(range.checkOut),
        nights: range.nights,
      }}
      category={category}
    />
  );
}

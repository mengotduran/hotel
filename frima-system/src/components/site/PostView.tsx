"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { Container, Eyebrow, Reveal } from "./primitives";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export function PostView({
  post,
}: {
  post: {
    titleFr: string;
    titleEn: string;
    bodyFr: string;
    bodyEn: string;
    excerptFr: string | null;
    excerptEn: string | null;
    category: string;
    authorName: string | null;
    publishedAt: string | null;
    coverId: string | null;
  };
}) {
  const { t, locale, date } = useI18n();

  const title = locale === "fr" ? post.titleFr : post.titleEn;
  const body = locale === "fr" ? post.bodyFr : post.bodyEn;
  const excerpt = locale === "fr" ? post.excerptFr : post.excerptEn;

  return (
    <main className="pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      <LiveRefresh topics={["blog"]} />

      <Container size="narrow">
        <Reveal>
          <Link
            href="/blog"
            className="eyebrow text-muted transition-colors hover:text-navy"
          >
            ← {t("site.blog.backToList")}
          </Link>

          <header className="mt-8">
            <Eyebrow tone="gold">
              {t(`site.blog.cat.${post.category}` as MessageKey)}
            </Eyebrow>
            <h1 className="display-lg mt-5 text-navy">{title}</h1>
            <p className="mt-6 text-sm text-muted">
              {post.publishedAt && `${t("site.blog.publishedOn")} ${date(post.publishedAt)}`}
              {post.authorName && ` · ${post.authorName}`}
            </p>
          </header>
        </Reveal>
      </Container>

      {post.coverId && (
        <Reveal className="mt-12">
          <Container size="wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/media/${post.coverId}`}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </Container>
        </Reveal>
      )}

      <Container size="narrow" className="mt-14">
      {excerpt && (
        <p className="lede border-l border-gold pl-6 text-foreground">{excerpt}</p>
      )}

      <div className="copy mt-10 space-y-5 text-foreground">
        {body
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((para, index) =>
            para.startsWith("## ") ? (
              <h2 key={index} className="display-md pt-8 text-navy">
                {para.slice(3)}
              </h2>
            ) : (
              <p key={index}>{para}</p>
            ),
          )}
      </div>
      </Container>
    </main>
  );
}

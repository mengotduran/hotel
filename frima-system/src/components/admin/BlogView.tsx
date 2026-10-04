"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  deletePost, savePost, setPostPublished, uploadPostCover,
} from "@/lib/actions/website";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, Input, PageHeader,
  Select, StatTile, Table, Td, Th, Textarea,
} from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { IconPlus } from "@/components/ui/Icons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface PostRow {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string | null;
  excerptEn: string | null;
  bodyFr: string;
  bodyEn: string;
  category: string;
  authorName: string | null;
  coverMediaId: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

const CATEGORIES = ["NEWS", "ROOMS", "OFFERS", "EVENTS"];

function CoverPicker({
  postId,
  coverMediaId,
}: {
  postId: string | null;
  coverMediaId: string | null;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaId, setMediaId] = useState(coverMediaId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);

    const form = new FormData();
    form.set("file", file);
    if (postId) form.set("postId", postId);

    const result = await uploadPostCover(form);
    setBusy(false);
    if (result.ok) setMediaId(result.data.mediaId);
    else setError(result.error);
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium">{t("post.cover")}</span>
      {/* Carried in the form so a brand-new post keeps the image on save. */}
      <input type="hidden" name="coverMediaId" value={mediaId ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-muted">
          {mediaId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/media/${mediaId}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-[11px] text-muted">
              —
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="px-2.5 py-1 text-xs"
          >
            {busy ? t("content.uploading") : t("content.addPhoto")}
          </Button>
          {mediaId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMediaId(null)}
              className="px-2.5 py-1 text-xs"
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

export function BlogView({ posts }: { posts: PostRow[] }) {
  const { t, date } = useI18n();
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [creating, setCreating] = useState(false);

  const save = useAction(savePost, {
    onSuccess: () => {
      setEditing(null);
      setCreating(false);
    },
  });
  const toggle = useAction(setPostPublished);
  const remove = useAction(deletePost);

  const open = creating || editing !== null;
  const published = posts.filter((post) => post.published).length;
  const { page, setPage, totalPages, pageRows } = usePagination(posts, 20);

  return (
    <>
      <PageHeader
        title={t("post.title")}
        subtitle={t("post.subtitle")}
        actions={
          <>
            <Link
              href="/blog"
              target="_blank"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              {t("site.nav.blog")} ↗
            </Link>
            <Button variant="gold" onClick={() => setCreating(true)}>
              <IconPlus className="h-4 w-4" />
              {t("post.new")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("post.publish")} value={String(published)} tone="positive" />
        <StatTile label={t("post.draft")} value={String(posts.length - published)} />
        <StatTile label={t("common.total")} value={String(posts.length)} />
      </div>

      <ErrorNote>{toggle.error ?? remove.error}</ErrorNote>

      <div className="mt-6">
        <Card bodyClassName="p-5 pt-3">
          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th />
                  <Th>{t("post.heading")}</Th>
                  <Th>{t("common.category")}</Th>
                  <Th>{t("site.blog.publishedOn")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("common.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((post) => (
                  <tr key={post.id}>
                    <Td>
                      <div className="h-10 w-16 overflow-hidden rounded border border-line bg-surface-muted">
                        {post.coverMediaId && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`/media/${post.coverMediaId}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="block max-w-[34ch] truncate font-medium">
                        {post.titleFr}
                      </span>
                      <span className="text-xs text-muted">/blog/{post.slug}</span>
                    </Td>
                    <Td className="text-xs text-muted">
                      {t(`site.blog.cat.${post.category}` as MessageKey)}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {post.publishedAt ? date(post.publishedAt) : "—"}
                    </Td>
                    <Td>
                      <Badge tone={post.published ? "positive" : "neutral"}>
                        {t(post.published ? "post.publish" : "post.draft")}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          disabled={toggle.pending}
                          onClick={() => toggle.run(post.id, !post.published)}
                          className="px-2 py-1 text-xs"
                        >
                          {t(post.published ? "post.unpublish" : "post.publish")}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditing(post)}
                          className="px-2 py-1 text-xs"
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={remove.pending}
                          onClick={() => remove.run(post.id)}
                          className="px-2 py-1 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      </div>

      <Modal
        open={open}
        title={editing ? t("common.edit") : t("post.new")}
        onClose={() => {
          setEditing(null);
          setCreating(false);
          save.clearError();
        }}
        wide
      >
        <form action={save.run} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <ErrorNote>{save.error}</ErrorNote>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("post.heading")} (FR) *`}>
              <Input name="titleFr" required defaultValue={editing?.titleFr} />
            </Field>
            <Field label={`${t("post.heading")} (EN)`}>
              <Input name="titleEn" defaultValue={editing?.titleEn} />
            </Field>
            <Field label={t("common.category")}>
              <Select name="category" defaultValue={editing?.category ?? "NEWS"}>
                {CATEGORIES.map((code) => (
                  <option key={code} value={code}>
                    {t(`site.blog.cat.${code}` as MessageKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("post.author")}>
              <Input name="authorName" defaultValue={editing?.authorName ?? ""} />
            </Field>
            <Field label={t("content.slug")} hint={editing ? `/blog/${editing.slug}` : undefined}>
              <Input name="slug" defaultValue={editing?.slug ?? ""} />
            </Field>
            <div className="flex items-end">
              <CoverPicker
                postId={editing?.id ?? null}
                coverMediaId={editing?.coverMediaId ?? null}
              />
            </div>
            <Field label={`${t("post.excerpt")} (FR)`}>
              <Textarea name="excerptFr" rows={2} defaultValue={editing?.excerptFr ?? ""} />
            </Field>
            <Field label={`${t("post.excerpt")} (EN)`}>
              <Textarea name="excerptEn" rows={2} defaultValue={editing?.excerptEn ?? ""} />
            </Field>
            <Field
              label={`${t("post.body")} (FR)`}
              hint="## pour un sous-titre · une ligne vide par paragraphe"
            >
              <Textarea name="bodyFr" rows={9} defaultValue={editing?.bodyFr ?? ""} />
            </Field>
            <Field label={`${t("post.body")} (EN)`}>
              <Textarea name="bodyEn" rows={9} defaultValue={editing?.bodyEn ?? ""} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={editing?.published ?? false}
              className="h-4 w-4 rounded border-line"
            />
            {t("post.publish")}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.pending}>
              {save.pending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

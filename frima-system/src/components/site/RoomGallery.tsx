"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Arrow } from "./HeroSlider";

export interface GalleryImage {
  id: string;
  altFr: string | null;
  altEn: string | null;
}

/**
 * A large image with prev/next arrows overlaid directly on it, and a row of
 * small thumbnails underneath. With three images per room this never needs
 * to scroll, so it stays a plain row rather than reaching for `Rail`.
 */
export function RoomGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  const current = images[active];
  const go = (delta: 1 | -1) =>
    setActive((v) => (v + delta + images.length) % images.length);
  const alt = (image: GalleryImage) =>
    (locale === "fr" ? image.altFr : image.altEn) ?? name;

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden bg-surface-muted sm:aspect-[16/11]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={`/media/${current.id}`}
          alt={alt(current)}
          className="img-fade h-full w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("site.rooms.gallery")}
              className="glass-pill absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-navy opacity-0 transition-opacity duration-300 hover:text-gold focus-visible:opacity-100 group-hover:opacity-100 sm:left-4"
            >
              <Arrow className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("site.rooms.gallery")}
              className="glass-pill absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-navy opacity-0 transition-opacity duration-300 hover:text-gold focus-visible:opacity-100 group-hover:opacity-100 sm:right-4"
            >
              <Arrow className="h-4 w-4" />
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-navy-deep/55 px-2.5 py-1 text-[0.6875rem] text-white backdrop-blur-sm">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-current={index === active}
              aria-label={`${t("site.rooms.gallery")} ${index + 1}`}
              className={`relative aspect-[4/3] overflow-hidden transition-opacity duration-300 ${
                index === active ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/${image.id}`}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
              {index === active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Arrow } from "./HeroSlider";

/**
 * Page numbers as `?page=`, kept alongside whatever filters are already in
 * the URL. Collapses to first/current-ish/last with an ellipsis once there
 * are more pages than fit, so it never grows wider than the row it sits in.
 */
export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const go = (target: number) => router.push(href(target));

  const pages = pageNumbers(page, totalPages);

  return (
    <nav
      aria-label={t("pagination.label")}
      className="mt-16 flex items-center justify-center gap-2 sm:mt-20"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label={t("pagination.prev")}
        className="grid h-9 w-9 place-items-center border border-line text-navy transition-colors duration-300 hover:border-navy disabled:pointer-events-none disabled:opacity-30"
      >
        <Arrow className="h-4 w-4 rotate-180" />
      </button>

      {pages.map((entry, index) =>
        entry === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => go(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`grid h-9 w-9 place-items-center text-sm transition-colors duration-300 ${
              entry === page
                ? "border border-navy bg-navy text-white"
                : "border border-line text-navy hover:border-navy"
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label={t("pagination.next")}
        className="grid h-9 w-9 place-items-center border border-line text-navy transition-colors duration-300 hover:border-navy disabled:pointer-events-none disabled:opacity-30"
      >
        <Arrow className="h-4 w-4" />
      </button>
    </nav>
  );
}

function pageNumbers(page: number, total: number): (number | "…")[] {
  const span = 1;
  const pages = new Set<number>([1, total, page]);
  for (let i = page - span; i <= page + span; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

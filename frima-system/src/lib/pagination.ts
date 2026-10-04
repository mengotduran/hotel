/**
 * Shared page-number math. Each listing page parses its own `?page=`, slices
 * its own query with `skip`/`take`, and renders a `<Pagination>` with the
 * `page`/`totalPages` this returns — the actual fetching stays local to each
 * page so it can keep its own filters and includes.
 */

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export interface PageWindow {
  page: number;
  totalPages: number;
  skip: number;
  take: number;
}

/** Clamps the requested page into range once the real count is known. */
export function pageWindow(
  requested: number,
  totalItems: number,
  perPage: number,
): PageWindow {
  const totalPages = Math.max(Math.ceil(totalItems / perPage), 1);
  const page = Math.min(Math.max(requested, 1), totalPages);
  return { page, totalPages, skip: (page - 1) * perPage, take: perPage };
}

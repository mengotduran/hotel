"use client";

import { useState } from "react";
import { Button } from "./Kit";

/**
 * Admin list tables are fetched in full and rendered client-side, so
 * pagination here just slices what's already in memory — no round-trip,
 * no URL state.
 */
export function usePagination<T>(rows: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    totalPages,
    pageRows: rows.slice(start, start + pageSize),
  };
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
      <span>
        Page {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Précédent
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

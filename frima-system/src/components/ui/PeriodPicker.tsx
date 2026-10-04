"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "./Kit";

/** Shared `du … au …` range control used across the accounting reports. */
export function PeriodPicker({ from, to }: { from: string; to: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: "from" | "to", value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-muted">
        {t("common.from")}
        <Input
          type="date"
          value={from}
          onChange={(e) => update("from", e.target.value)}
          className="w-auto py-1.5"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        {t("common.to")}
        <Input
          type="date"
          value={to}
          onChange={(e) => update("to", e.target.value)}
          className="w-auto py-1.5"
        />
      </label>
    </div>
  );
}

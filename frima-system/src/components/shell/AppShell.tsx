"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { Nav } from "./Nav";
import { IconGlobe } from "@/components/ui/Icons";

function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-navy-deep font-bold">
        F
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-wide text-white">
          {t("app.name")}
        </p>
        <p className="truncate text-[11px] text-white/50">{t("app.subtitle")}</p>
      </div>
    </div>
  );
}

function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
      <IconGlobe className="mx-1.5 h-4 w-4 text-muted" />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          title={LOCALE_LABELS[code]}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors ${
            locale === code
              ? "bg-navy text-white"
              : "text-muted hover:bg-surface-muted"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex min-h-full">
      {/* Sidebar · permanent from lg up, a drawer below it. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] overflow-y-auto bg-navy-deep transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } no-print`}
      >
        <Brand />
        <Nav onNavigate={() => setOpen(false)} />
        <p className="px-5 pb-6 text-[11px] leading-relaxed text-white/30">
          {t("acct.standard")}
        </p>
      </aside>

      {open && (
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden no-print"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:px-8 no-print">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden"
          >
            <span className="space-y-1">
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block h-0.5 w-4 bg-foreground" />
            </span>
          </button>
          <p className="hidden text-sm text-muted sm:block">
            {t("app.tagline")}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitch />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import {
  IconAnalytical, IconBalance, IconBed, IconCalendar, IconCashBook,
  IconCashIn, IconCashOut, IconDashboard, IconDepartments, IconInvoice,
  IconJournal, IconLedger, IconReceipt, IconSettings, IconTruck, IconUsers,
  IconGlobe, IconInbox, IconNews,
} from "@/components/ui/Icons";

interface NavItem {
  href: string;
  labelKey: MessageKey;
  Icon: (p: { className?: string }) => React.ReactElement;
}

interface NavGroup {
  titleKey: MessageKey;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    titleKey: "nav.groupOperations",
    items: [
      { href: "/admin", labelKey: "nav.dashboard", Icon: IconDashboard },
      { href: "/admin/departments", labelKey: "nav.departments", Icon: IconDepartments },
      { href: "/admin/rooms", labelKey: "nav.rooms", Icon: IconBed },
      { href: "/admin/occupancy", labelKey: "nav.occupancy", Icon: IconCalendar },
      { href: "/admin/clients", labelKey: "nav.clients", Icon: IconUsers },
      { href: "/admin/suppliers", labelKey: "nav.suppliers", Icon: IconTruck },
    ],
  },
  {
    titleKey: "nav.groupTreasury",
    items: [
      { href: "/admin/invoices", labelKey: "nav.invoices", Icon: IconInvoice },
      { href: "/admin/payments", labelKey: "nav.payments", Icon: IconCashIn },
      { href: "/admin/receipts", labelKey: "nav.receipts", Icon: IconReceipt },
      { href: "/admin/expenses", labelKey: "nav.expenses", Icon: IconCashOut },
      { href: "/admin/cashbook", labelKey: "nav.cashbook", Icon: IconCashBook },
    ],
  },
  {
    titleKey: "nav.groupWebsite",
    items: [
      { href: "/admin/bookings", labelKey: "nav.bookings", Icon: IconInbox },
      { href: "/admin/content", labelKey: "nav.content", Icon: IconGlobe },
      { href: "/admin/blog", labelKey: "nav.blog", Icon: IconNews },
      { href: "/admin/newsletter", labelKey: "nav.newsletter", Icon: IconInbox },
    ],
  },
  {
    titleKey: "nav.groupAccounting",
    items: [
      { href: "/admin/accounting/journal", labelKey: "nav.journal", Icon: IconJournal },
      { href: "/admin/accounting/ledger", labelKey: "nav.ledger", Icon: IconLedger },
      { href: "/admin/accounting/trial-balance", labelKey: "nav.trialBalance", Icon: IconBalance },
      { href: "/admin/accounting/analytical", labelKey: "nav.analytical", Icon: IconAnalytical },
    ],
  },
  {
    titleKey: "nav.groupAdmin",
    items: [{ href: "/admin/settings", labelKey: "nav.settings", Icon: IconSettings }],
  },
];

export function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group.titleKey}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
            {t(group.titleKey)}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, labelKey, Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-gold/15 text-gold-soft font-medium"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

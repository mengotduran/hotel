/** Inline icon set · keeps the app free of an icon dependency. */

type IconProps = { className?: string };

const base = "h-[18px] w-[18px] shrink-0";

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconDepartments = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M10 21v-5h4v5" />
  </Svg>
);

export const IconBed = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18v-11" />
    <path d="M3 12h18a0 0 0 0 1 0 0v6" />
    <path d="M3 18h18" />
    <path d="M7 12V9h4a2 2 0 0 1 2 2v1" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 11.5a3 3 0 1 0-1.5-5.6" />
    <path d="M17.5 20c0-2.3-.8-4-2-5" />
  </Svg>
);

export const IconTruck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </Svg>
);

export const IconInvoice = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 2h9l4 4v16l-2.5-1.5L14 22l-2-1.5L10 22l-2.5-1.5L5 22V6z" />
    <path d="M9 9h7M9 13h7M9 17h4" />
  </Svg>
);

export const IconCashIn = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 10v4M18 10v4" />
  </Svg>
);

export const IconReceipt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 2h14v20l-2.3-1.6L14.4 22l-2.4-1.6L9.6 22l-2.3-1.6L5 22z" />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
  </Svg>
);

export const IconCashOut = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <path d="M4 18v2h16v-2" />
  </Svg>
);

export const IconCashBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4.5A2 2 0 0 1 6 3h13v18H6a2 2 0 0 1-2-2z" />
    <path d="M4 17h15" />
    <path d="M9 7h6M9 11h6" />
  </Svg>
);

export const IconJournal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 3h16v18H4z" />
    <path d="M8 3v18" />
    <path d="M11 8h6M11 12h6M11 16h3" />
  </Svg>
);

export const IconLedger = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18v14H3z" />
    <path d="M3 10h18M3 15h18M9 5v14M15 5v14" />
  </Svg>
);

export const IconBalance = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="M5 7h14" />
    <path d="M8 7l-4 7h8z" />
    <path d="M16 7l-4 7h8z" />
  </Svg>
);

export const IconAnalytical = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconPrint = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M6 15h12v6H6z" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M4.5 5h15l1.5 8v6H3v-6z" />
  </Svg>
);

export const IconNews = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5h13v14H4z" />
    <path d="M17 9h3v8a2 2 0 0 1-2 2h-1z" />
    <path d="M7 9h7M7 12.5h7M7 16h4" />
  </Svg>
);

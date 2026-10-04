import type { AmenityCode } from "@/lib/amenities";

/**
 * One small line icon per amenity code, in the same stroke style as the rest
 * of the icon set (24x24, round caps and joins, currentColor).
 */

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-6 w-6"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const WIFI = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5a12 12 0 0 1 16 0" />
    <path d="M7 12a8 8 0 0 1 10 0" />
    <path d="M10 15.5a4 4 0 0 1 4 0" />
    <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

const AC = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="6" rx="1.6" />
    <path d="M7 13v2.2M12 13v3M17 13v2.2" />
  </Svg>
);

const TV = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="12" rx="1.6" />
    <path d="M9 21h6M12 17v4" />
  </Svg>
);

const FRIDGE = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="2" width="12" height="20" rx="1.6" />
    <path d="M6 9.5h12" />
    <path d="M9 5.2v2M9 12.5v2" />
  </Svg>
);

const KITCHEN = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M2 10h20" />
    <path d="M7 10V8.5a5 5 0 0 1 10 0V10" />
  </Svg>
);

const BATHROOM = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 9h8" />
    <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
    <path d="M9 13v1.3M12 13v2M15 13v1.3" />
  </Svg>
);

const HOT_WATER = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c3.2 4.2 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.8-6.8 6-11z" />
  </Svg>
);

const DESK = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="3" rx="0.8" />
    <path d="M6 9v9M18 9v9" />
    <path d="M3.5 15h5" />
  </Svg>
);

const BALCONY = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h18" />
    <path d="M5.5 8v10M9.5 8v10M14.5 8v10M18.5 8v10" />
    <path d="M3 18h18" />
  </Svg>
);

const PARKING = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M10 16.5V7.5h3a2.6 2.6 0 0 1 0 5.2h-3" />
  </Svg>
);

const BREAKFAST = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9h11v5a5 5 0 0 1-5 5H9a4 4 0 0 1-4-4z" />
    <path d="M16 10.3h1.6a2.2 2.2 0 0 1 0 4.4H16" />
    <path d="M8 5c0 1-1 1-1 2M12 5c0 1-1 1-1 2" />
  </Svg>
);

const LAUNDRY = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="12" cy="13.5" r="4.6" />
    <path d="M7.5 6h.01M10.3 6h.01" />
  </Svg>
);

const SHUTTLE = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 16V9a1 1 0 0 1 1-1h8.5l4.5 4v4" />
    <circle cx="7.5" cy="16.5" r="1.7" />
    <circle cx="16" cy="16.5" r="1.7" />
    <path d="M3 13h14" />
  </Svg>
);

const SAFE = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 10.2v2l1.3 1.1" />
  </Svg>
);

const PROJECTOR = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="8" width="12" height="7" rx="1.6" />
    <circle cx="8.5" cy="11.5" r="2" />
    <path d="M14.5 11h2.5l3.5-2.3v5.6L17 12z" />
  </Svg>
);

const SOUND = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
    <path d="M18.3 7a7.2 7.2 0 0 1 0 10" />
  </Svg>
);

const GENERATOR = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M13 7.5l-4 6h3l-1 4 4-6h-3z" />
  </Svg>
);

const ICONS: Record<AmenityCode, (p: IconProps) => React.ReactElement> = {
  WIFI, AC, TV, FRIDGE, KITCHEN, BATHROOM, HOT_WATER, DESK, BALCONY,
  PARKING, BREAKFAST, LAUNDRY, SHUTTLE, SAFE, PROJECTOR, SOUND, GENERATOR,
};

export function AmenityIcon({
  code,
  className = "h-6 w-6",
}: {
  code: string;
  className?: string;
}) {
  const Icon = ICONS[code as AmenityCode];
  if (!Icon) return null;
  return <Icon className={className} />;
}

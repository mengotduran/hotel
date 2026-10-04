"use client";

import { useI18n } from "@/lib/i18n/context";

// --- Page scaffolding ------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,32,46,0.04)] ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-navy">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// --- Figures ---------------------------------------------------------------

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "gold" | "warning";
}) {
  const accent = {
    neutral: "text-navy",
    positive: "text-positive",
    negative: "text-negative",
    gold: "text-[#9a7a12]",
    warning: "text-warning",
  }[tone];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,32,46,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className={`tabular mt-2 text-xl font-semibold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Horizontal share bar used for the department and category breakdowns. */
export function ShareBar({
  rows,
}: {
  rows: { label: string; value: string; share: number; colour: string }[];
}) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{row.label}</span>
            <span className="tabular shrink-0 font-medium text-navy">{row.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(row.share * 100, row.share > 0 ? 2 : 0)}%`,
                backgroundColor: row.colour,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// --- Tables ----------------------------------------------------------------

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-line pb-2.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-line/70 py-2.5 align-middle ${
        align === "right" ? "tabular text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <p className="py-10 text-center text-sm text-muted">
      {message ?? t("common.empty")}
    </p>
  );
}

// --- Badges ----------------------------------------------------------------

export type BadgeTone = "neutral" | "positive" | "negative" | "warning" | "info" | "gold";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  positive: "bg-[#e7f3ed] text-positive",
  negative: "bg-[#fbe9e7] text-negative",
  warning: "bg-[#fdf3e0] text-warning",
  info: "bg-[#e8f0fa] text-info",
  gold: "bg-[#fbf3da] text-[#9a7a12]",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// --- Controls --------------------------------------------------------------

const BUTTON_VARIANTS = {
  primary: "bg-navy text-white hover:bg-navy-deep",
  gold: "bg-gold text-navy-deep hover:bg-gold-soft",
  secondary: "border border-line bg-surface text-foreground hover:bg-surface-muted",
  danger: "border border-[#f0c6c2] bg-[#fbe9e7] text-negative hover:bg-[#f6ddda]",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/15 disabled:bg-surface-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function ErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-[#f0c6c2] bg-[#fbe9e7] px-3 py-2 text-sm text-negative">
      {children}
    </p>
  );
}

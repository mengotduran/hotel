"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { confirmBookingRequest, declineBookingRequest } from "@/lib/actions/bookings";
import { useAction } from "@/components/ui/useAction";
import { Modal } from "@/components/ui/Modal";
import {
  Badge, Button, Card, EmptyState, ErrorNote, Field, PageHeader, StatTile,
  Table, Td, Th, Textarea, type BadgeTone,
} from "@/components/ui/Kit";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface BookingRow {
  id: string;
  reference: string;
  status: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestCountry: string | null;
  roomName: string;
  roomSlug: string;
  nightlyRate: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  message: string | null;
  createdAt: string;
  declineReason: string | null;
  stillFree: boolean;
}

const TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "positive",
  DECLINED: "negative",
  CANCELLED: "neutral",
};

export function BookingsView({
  bookings,
  counts,
}: {
  bookings: BookingRow[];
  counts: { pending: number; confirmed: number; declined: number };
}) {
  const { t, money, date } = useI18n();
  const [declining, setDeclining] = useState<BookingRow | null>(null);
  const [reason, setReason] = useState("");

  const confirm = useAction(confirmBookingRequest);
  const decline = useAction(declineBookingRequest, {
    onSuccess: () => {
      setDeclining(null);
      setReason("");
    },
  });

  const pending = bookings.filter((b) => b.status === "PENDING");
  const handled = bookings.filter((b) => b.status !== "PENDING");
  const { page, setPage, totalPages, pageRows: handledPage } = usePagination(handled, 20);

  return (
    <>
      <PageHeader
        title={t("booking.title")}
        subtitle={t("booking.subtitle")}
        actions={
          <Link
            href="/rooms"
            target="_blank"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            {t("site.nav.rooms")} ↗
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={t("booking.pending")} value={String(counts.pending)} tone="warning" />
        <StatTile label={t("booking.confirmed")} value={String(counts.confirmed)} tone="positive" />
        <StatTile label={t("booking.declined")} value={String(counts.declined)} />
      </div>

      <ErrorNote>{confirm.error}</ErrorNote>

      <div className="mt-6 space-y-4">
        {pending.length === 0 ? (
          <Card>
            <EmptyState message={t("booking.noneePending")} />
          </Card>
        ) : (
          pending.map((booking) => (
            <Card key={booking.id} bodyClassName="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="tabular text-sm font-semibold text-navy">
                      {booking.reference}
                    </span>
                    <Badge tone={TONE[booking.status]}>
                      {t(`site.book.status.${booking.status}` as MessageKey)}
                    </Badge>
                    {!booking.stillFree && (
                      <Badge tone="negative">{t("booking.conflict")}</Badge>
                    )}
                  </div>

                  <p className="mt-2 font-medium">{booking.guestName}</p>
                  <p className="text-sm text-muted">
                    <a href={`tel:${booking.guestPhone}`} className="hover:underline">
                      {booking.guestPhone}
                    </a>
                    {booking.guestEmail && ` · ${booking.guestEmail}`}
                    {booking.guestCountry && ` · ${booking.guestCountry}`}
                  </p>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("common.room")}</dt>
                      <dd className="font-medium">{booking.roomName}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("stay.checkIn")}</dt>
                      <dd>{date(booking.checkIn)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("stay.checkOut")}</dt>
                      <dd>{date(booking.checkOut)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("common.nights")}</dt>
                      <dd className="tabular">{booking.nights}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("stay.adults")}</dt>
                      <dd className="tabular">
                        {booking.adults}
                        {booking.children > 0 && ` + ${booking.children}`}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t("site.book.total")}</dt>
                      <dd className="tabular font-medium">
                        {money(booking.nightlyRate * booking.nights)}
                      </dd>
                    </div>
                  </dl>

                  {booking.message && (
                    <p className="mt-3 rounded-lg bg-surface-muted p-3 text-sm text-muted">
                      {booking.message}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted">
                    {t("booking.submittedAt")} {date(booking.createdAt, true)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    variant="primary"
                    disabled={confirm.pending || !booking.stillFree}
                    onClick={() => confirm.run(booking.id)}
                  >
                    {t("booking.confirm")}
                  </Button>
                  <Button variant="danger" onClick={() => setDeclining(booking)}>
                    {t("booking.decline")}
                  </Button>
                </div>
              </div>
              <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                {t("booking.createsStay")}
              </p>
            </Card>
          ))
        )}
      </div>

      {handled.length > 0 && (
        <div className="mt-6">
          <Card title={t("common.all")} bodyClassName="p-5 pt-3">
            <Table>
              <thead>
                <tr>
                  <Th>{t("common.reference")}</Th>
                  <Th>{t("booking.guest")}</Th>
                  <Th>{t("common.room")}</Th>
                  <Th>{t("stay.checkIn")}</Th>
                  <Th>{t("common.status")}</Th>
                  <Th align="right">{t("site.book.total")}</Th>
                </tr>
              </thead>
              <tbody>
                {handledPage.map((booking) => (
                  <tr key={booking.id}>
                    <Td className="tabular text-xs text-muted">{booking.reference}</Td>
                    <Td>
                      <span className="block font-medium">{booking.guestName}</span>
                      <span className="text-xs text-muted">{booking.guestPhone}</span>
                    </Td>
                    <Td>{booking.roomName}</Td>
                    <Td className="whitespace-nowrap text-muted">
                      {date(booking.checkIn)}
                    </Td>
                    <Td>
                      <Badge tone={TONE[booking.status] ?? "neutral"}>
                        {t(`site.book.status.${booking.status}` as MessageKey)}
                      </Badge>
                      {booking.declineReason && (
                        <span className="mt-1 block text-xs text-muted">
                          {booking.declineReason}
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      {money(booking.nightlyRate * booking.nights)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </Card>
        </div>
      )}

      <Modal
        open={declining !== null}
        title={`${t("booking.decline")} · ${declining?.reference ?? ""}`}
        onClose={() => {
          setDeclining(null);
          decline.clearError();
        }}
      >
        <div className="space-y-4">
          <ErrorNote>{decline.error}</ErrorNote>
          <p className="text-sm text-muted">
            {declining?.guestName} · {declining?.roomName}
          </p>
          <Field label={t("booking.declineReason")}>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeclining(null)}>
              {t("common.close")}
            </Button>
            <Button
              variant="danger"
              disabled={decline.pending}
              onClick={() => declining && decline.run(declining.id, reason)}
            >
              {decline.pending ? t("common.saving") : t("common.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

import { prisma } from "@/lib/prisma";
import { occupancySnapshot, toInputDate } from "@/lib/reporting";
import { OccupancyView, type StayRow, type UnitRow } from "@/components/occupancy/OccupancyView";

export const dynamic = "force-dynamic";

export default async function OccupancyPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 21);

  const [units, stays, clients, snapshot] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: [{ kind: "asc" }, { number: "asc" }],
    }),
    prisma.stay.findMany({
      where: {
        OR: [
          { status: { in: ["RESERVED", "CHECKED_IN"] } },
          { checkOut: { gte: today, lte: horizon } },
        ],
      },
      include: {
        room: { select: { number: true } },
        client: { select: { name: true } },
      },
      orderBy: { checkIn: "asc" },
    }),
    prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    occupancySnapshot(today),
  ]);

  const unitRows: UnitRow[] = units.map((u) => ({
    id: u.id,
    number: u.number,
    kind: u.kind,
    name: u.name,
    baseRate: u.baseRate,
    status: u.status,
  }));

  const stayRows: StayRow[] = stays.map((s) => ({
    id: s.id,
    reference: s.reference,
    roomId: s.roomId,
    roomNumber: s.room.number,
    clientId: s.clientId,
    clientName: s.client.name,
    checkIn: s.checkIn.toISOString(),
    checkOut: s.checkOut.toISOString(),
    nightlyRate: s.nightlyRate,
    adults: s.adults,
    children: s.children,
    status: s.status,
    invoiceId: s.invoiceId,
  }));

  return (
    <OccupancyView
      units={unitRows}
      stays={stayRows}
      clients={clients}
      snapshot={snapshot}
      today={toInputDate(today)}
    />
  );
}

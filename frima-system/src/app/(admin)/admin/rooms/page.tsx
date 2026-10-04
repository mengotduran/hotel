import { prisma } from "@/lib/prisma";
import { RoomsView, type RoomRow } from "@/components/rooms/RoomsView";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [rooms, departments] = await Promise.all([
    prisma.room.findMany({
      orderBy: [{ kind: "asc" }, { number: "asc" }],
      include: {
        stays: {
          where: { status: "CHECKED_IN" },
          include: { client: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const rows: RoomRow[] = rooms.map((room) => ({
    id: room.id,
    number: room.number,
    kind: room.kind,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    baseRate: room.baseRate,
    status: room.status,
    notes: room.notes,
    active: room.active,
    departmentId: room.departmentId,
    currentGuest: room.stays[0]?.client.name ?? null,
  }));

  return (
    <RoomsView
      rooms={rows}
      departments={departments.map((d) => ({
        id: d.id,
        nameFr: d.nameFr,
        nameEn: d.nameEn,
      }))}
    />
  );
}

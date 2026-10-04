import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CHART_OF_ACCOUNTS } from "../src/lib/accounting/chart";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

const SETTINGS: Record<string, string> = {
  "hotel.name": "FRIMA Guest Suites",
  "hotel.tagline.fr": "Votre havre de paix et de confort",
  "hotel.tagline.en": "Your Haven of Peace and Comfort",
  "hotel.address": "Ntoun, à proximité de l'aéroport de Nsimalen",
  "hotel.city": "Yaoundé",
  "hotel.country": "Cameroun",
  "hotel.phones": "+237 652 713 755 · +237 677 722 875 · +1 647 273 0898",
  "hotel.taxId": "",
  "finance.currency": "XAF",
  // Cameroon VAT: 17,5 % plus the 10 % additional council tax = 19,25 %.
  "finance.vatRate": "19.25",
  "finance.tourismTaxPerNight": "0",
  "receipt.issuedBy": "",
};

const DEPARTMENTS = [
  {
    code: "HEB",
    nameFr: "Hébergement",
    nameEn: "Accommodation",
    revenueAccount: "7061",
    colour: "#1E3A5F",
    sortOrder: 1,
  },
  {
    code: "RES",
    nameFr: "Restauration",
    nameEn: "Food & beverage",
    revenueAccount: "7062",
    colour: "#C9A227",
    sortOrder: 2,
  },
  {
    code: "ESP",
    nameFr: "Disposition d'espace",
    nameEn: "Space rental",
    revenueAccount: "7063",
    colour: "#2F6F5E",
    sortOrder: 3,
  },
  {
    code: "GEN",
    nameFr: "Général",
    nameEn: "General",
    revenueAccount: "7068",
    colour: "#6B7280",
    sortOrder: 4,
  },
];

/** The five direct operating cost families named in the client's brief. */
const EXPENSE_CATEGORIES = [
  {
    code: "ENERGY",
    nameFr: "Coûts énergétiques (eau, électricité, carburant)",
    nameEn: "Energy costs (water, electricity, fuel)",
    expenseAccount: "6052",
    sortOrder: 1,
  },
  {
    code: "RAW_MATERIALS",
    nameFr: "Matières premières (denrées alimentaires et boissons)",
    nameEn: "Raw materials (food and beverages)",
    expenseAccount: "602",
    sortOrder: 2,
  },
  {
    code: "ADMIN",
    nameFr: "Frais administratifs (internet, fournitures, encre, impôts)",
    nameEn: "Administrative costs (internet, stationery, ink, taxes)",
    expenseAccount: "628",
    sortOrder: 3,
  },
  {
    code: "OPERATING_SUPPLIES",
    nameFr: "Fournitures opérationnelles (entretien, savons, kits, linge)",
    nameEn: "Operating supplies (cleaning, soaps, guest kits, linen)",
    expenseAccount: "604",
    sortOrder: 4,
  },
  {
    code: "DIRECT_STAFF",
    nameFr: "Frais de personnel directs (salaires, cotisations sociales)",
    nameEn: "Direct staff costs (salaries, social contributions)",
    expenseAccount: "661",
    sortOrder: 5,
  },
];

/**
 * Starter inventory. The real unit list is edited in the application;
 * this is a plausible shape so the system is usable from the first launch.
 */
const ROOMS = [
  { number: "101", kind: "ROOM", name: "Chambre standard", floor: "1", capacity: 2, baseRate: 25000 },
  { number: "102", kind: "ROOM", name: "Chambre standard", floor: "1", capacity: 2, baseRate: 25000 },
  { number: "103", kind: "ROOM", name: "Chambre standard", floor: "1", capacity: 2, baseRate: 25000 },
  { number: "104", kind: "ROOM", name: "Chambre supérieure", floor: "1", capacity: 2, baseRate: 32000 },
  { number: "201", kind: "ROOM", name: "Chambre supérieure", floor: "2", capacity: 2, baseRate: 32000 },
  { number: "202", kind: "ROOM", name: "Chambre supérieure", floor: "2", capacity: 3, baseRate: 35000 },
  { number: "203", kind: "STUDIO", name: "Studio meublé", floor: "2", capacity: 2, baseRate: 45000 },
  { number: "204", kind: "STUDIO", name: "Studio meublé", floor: "2", capacity: 2, baseRate: 45000 },
  { number: "301", kind: "APARTMENT", name: "Appartement 2 chambres", floor: "3", capacity: 4, baseRate: 75000 },
  { number: "302", kind: "APARTMENT", name: "Appartement 2 chambres", floor: "3", capacity: 4, baseRate: 75000 },
];

const SPACES = [
  { number: "SALLE-CONF", kind: "HALL", name: "Salle de conférence", floor: "RDC", capacity: 120, baseRate: 150000 },
  { number: "SALLE-REU", kind: "HALL", name: "Salle de réunion", floor: "RDC", capacity: 25, baseRate: 60000 },
  { number: "ESPACE-EVT", kind: "HALL", name: "Espace événementiel", floor: "RDC", capacity: 200, baseRate: 250000 },
];

/**
 * What the public website shows for each unit. Keyed by room number so the
 * inventory above stays readable. Photos are uploaded from the admin. Every
 * unit is published from the start so the site is never an empty shell.
 */
const PUBLIC_CONTENT: Record<
  string,
  {
    headlineFr: string;
    headlineEn: string;
    descriptionFr: string;
    descriptionEn: string;
    amenities: string[];
    featured?: boolean;
  }
> = {
  ROOM_STANDARD: {
    headlineFr: "Une chambre simple et soignée pour une étape de courte durée.",
    headlineEn: "A simple, well-kept room for a short stop.",
    descriptionFr:
      "Lit double, salle d'eau privative avec eau chaude, climatisation et connexion Wi-Fi.\nIdéale pour une nuit entre deux vols : l'aéroport de Nsimalen est à une dizaine de minutes de route.\nLe petit-déjeuner est servi à partir de 6h, ce qui laisse le temps avant un vol matinal.",
    descriptionEn:
      "Double bed, private bathroom with hot water, air conditioning and Wi-Fi.\nMade for a night between two flights, with Nsimalen airport about ten minutes away.\nBreakfast is served from 6am, which leaves time before an early departure.",
    amenities: ["WIFI", "AC", "TV", "BATHROOM", "HOT_WATER", "PARKING", "GENERATOR"],
  },
  ROOM_SUPERIOR: {
    headlineFr: "Plus d'espace et un coin bureau, pour les séjours de travail.",
    headlineEn: "More space and a work corner, for working stays.",
    descriptionFr:
      "Chambre spacieuse avec lit double, bureau, réfrigérateur et coffre-fort.\nPensée pour les séjours professionnels : la connexion est stable et un groupe électrogène prend le relais en cas de coupure.\nLe service de blanchisserie permet de repartir avec une valise propre.",
    descriptionEn:
      "A roomier space with a double bed, desk, fridge and safe.\nBuilt for business stays: the connection is steady and a backup generator takes over during a power cut.\nThe laundry service means you leave with a clean suitcase.",
    amenities: ["WIFI", "AC", "TV", "FRIDGE", "DESK", "BATHROOM", "HOT_WATER", "SAFE", "PARKING", "GENERATOR"],
    featured: true,
  },
  STUDIO: {
    headlineFr: "Un studio meublé avec coin cuisine, pour les séjours prolongés.",
    headlineEn: "A furnished studio with a kitchenette, for longer stays.",
    descriptionFr:
      "Studio indépendant avec coin cuisine équipé, salle d'eau privative et espace de vie séparé du couchage.\nLa formule convient aux séjours de plusieurs semaines : on y cuisine, on y travaille, on y reçoit.\nLe ménage et le linge sont assurés sur demande.",
    descriptionEn:
      "A self-contained studio with a fitted kitchenette, private bathroom and a living area separate from the bed.\nIt suits stays of several weeks: you can cook, work and host.\nHousekeeping and linen on request.",
    amenities: ["WIFI", "AC", "TV", "FRIDGE", "KITCHEN", "DESK", "BATHROOM", "HOT_WATER", "LAUNDRY", "PARKING", "GENERATOR"],
    featured: true,
  },
  APARTMENT: {
    headlineFr: "Deux chambres, un salon et une cuisine : la maison loin de chez soi.",
    headlineEn: "Two bedrooms, a living room and a kitchen. A home away from home.",
    descriptionFr:
      "Appartement de deux chambres avec salon, cuisine équipée et balcon, pouvant accueillir jusqu'à quatre personnes.\nLa formule est faite pour les familles et pour les missions longues, avec le confort d'un logement autonome et les services d'un hôtel.\nParking sur place et navette aéroport sur demande.",
    descriptionEn:
      "A two-bedroom apartment with a living room, fitted kitchen and balcony, sleeping up to four.\nMade for families and long assignments: the independence of a flat with the services of a hotel.\nOn-site parking and an airport shuttle on request.",
    amenities: ["WIFI", "AC", "TV", "FRIDGE", "KITCHEN", "BALCONY", "BATHROOM", "HOT_WATER", "LAUNDRY", "SHUTTLE", "PARKING", "GENERATOR"],
    featured: true,
  },
  "SALLE-CONF": {
    headlineFr: "Jusqu'à 120 places pour vos séminaires et assemblées.",
    headlineEn: "Up to 120 seats for your seminars and general meetings.",
    descriptionFr:
      "Salle de conférence modulable, équipée en sonorisation et vidéoprojection, avec climatisation et connexion internet.\nLes formules journée et demi-journée comprennent l'installation de la salle ; les pauses-café et la restauration se commandent à la carte.\nL'hébergement des participants se réserve dans le même mouvement.",
    descriptionEn:
      "A reconfigurable conference hall with a sound system and projector, air conditioning and internet.\nFull-day and half-day rates include the room set-up; coffee breaks and catering are ordered separately.\nAccommodation for delegates can be booked at the same time.",
    amenities: ["WIFI", "AC", "PROJECTOR", "SOUND", "PARKING", "GENERATOR"],
    featured: true,
  },
  "SALLE-REU": {
    headlineFr: "Une salle de réunion de 25 places, à la journée.",
    headlineEn: "A 25-seat meeting room, by the day.",
    descriptionFr:
      "Salle de réunion en table unique, adaptée aux comités, formations et entretiens.\nÉquipée d'un vidéoprojecteur, de la climatisation et du Wi-Fi.",
    descriptionEn:
      "A single-table meeting room suited to committees, training and interviews.\nProjector, air conditioning and Wi-Fi included.",
    amenities: ["WIFI", "AC", "PROJECTOR", "PARKING", "GENERATOR"],
  },
  "ESPACE-EVT": {
    headlineFr: "Un espace de 200 places pour vos réceptions.",
    headlineEn: "A 200-capacity space for your receptions.",
    descriptionFr:
      "Espace événementiel pour mariages, cocktails et lancements, avec sonorisation et accès direct au parking.\nLa restauration est assurée par la cuisine de l'établissement.",
    descriptionEn:
      "An events space for weddings, cocktails and launches, with a sound system and direct access to the car park.\nCatering is handled by the property's own kitchen.",
    amenities: ["WIFI", "SOUND", "PARKING", "GENERATOR"],
  },
};

/** Maps a unit to its content block. */
function contentKeyFor(room: { number: string; kind: string; name?: string }): string {
  if (room.kind === "HALL") return room.number;
  if (room.kind === "STUDIO") return "STUDIO";
  if (room.kind === "APARTMENT") return "APARTMENT";
  return room.name?.includes("supérieure") ? "ROOM_SUPERIOR" : "ROOM_STANDARD";
}

const SERVICE_ITEMS = [
  // Restauration
  { code: "PDJ", nameFr: "Petit-déjeuner", nameEn: "Breakfast", dept: "RES", category: "BREAKFAST", unitPrice: 3500, unit: "couvert" },
  { code: "REST-MENU", nameFr: "Menu du jour", nameEn: "Dish of the day", dept: "RES", category: "RESTAURANT", unitPrice: 6000, unit: "couvert" },
  { code: "REST-CARTE", nameFr: "Plat à la carte", nameEn: "À la carte dish", dept: "RES", category: "RESTAURANT", unitPrice: 8500, unit: "couvert" },
  { code: "BAR-SOFT", nameFr: "Boisson sans alcool", nameEn: "Soft drink", dept: "RES", category: "BAR", unitPrice: 1000, unit: "unité" },
  { code: "BAR-BIERE", nameFr: "Bière", nameEn: "Beer", dept: "RES", category: "BAR", unitPrice: 1500, unit: "unité" },
  { code: "BAR-VIN", nameFr: "Vin (bouteille)", nameEn: "Wine (bottle)", dept: "RES", category: "BAR", unitPrice: 12000, unit: "bouteille" },
  { code: "BAR-EAU", nameFr: "Eau minérale", nameEn: "Mineral water", dept: "RES", category: "BAR", unitPrice: 700, unit: "unité" },

  // Disposition d'espace
  { code: "CONF-JOUR", nameFr: "Salle de conférence, journée", nameEn: "Conference hall, full day", dept: "ESP", category: "HALL", unitPrice: 150000, unit: "journée" },
  { code: "CONF-DEMI", nameFr: "Salle de conférence, demi-journée", nameEn: "Conference hall, half day", dept: "ESP", category: "HALL", unitPrice: 90000, unit: "demi-journée" },
  { code: "REU-JOUR", nameFr: "Salle de réunion, journée", nameEn: "Meeting room, full day", dept: "ESP", category: "HALL", unitPrice: 60000, unit: "journée" },
  { code: "PAUSE-CAFE", nameFr: "Pause-café séminaire", nameEn: "Seminar coffee break", dept: "ESP", category: "HALL", unitPrice: 2500, unit: "personne" },

  // Hébergement extras
  { code: "NUITEE", nameFr: "Nuitée", nameEn: "Room night", dept: "HEB", category: "ROOM", unitPrice: 25000, unit: "nuitée" },
  { code: "LIT-SUP", nameFr: "Lit supplémentaire", nameEn: "Extra bed", dept: "HEB", category: "ROOM", unitPrice: 7000, unit: "nuitée" },
  { code: "BLANCHISSERIE", nameFr: "Blanchisserie", nameEn: "Laundry", dept: "HEB", category: "EXTRA", unitPrice: 3000, unit: "service" },
  { code: "NAVETTE", nameFr: "Navette aéroport", nameEn: "Airport shuttle", dept: "HEB", category: "EXTRA", unitPrice: 10000, unit: "trajet" },
];

async function main() {
  console.log("Seeding FRIMA Guest Suites…");

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
  console.log(`  settings            ${Object.keys(SETTINGS).length}`);

  for (const account of CHART_OF_ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: account.code },
      create: account,
      update: {
        nameFr: account.nameFr,
        nameEn: account.nameEn,
        type: account.type,
        klass: account.klass,
      },
    });
  }
  console.log(`  chart of accounts   ${CHART_OF_ACCOUNTS.length}`);

  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      create: dept,
      update: { revenueAccount: dept.revenueAccount, colour: dept.colour },
    });
  }
  console.log(`  departments         ${DEPARTMENTS.length}`);

  for (const category of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      create: category,
      update: { expenseAccount: category.expenseAccount },
    });
  }
  console.log(`  expense categories  ${EXPENSE_CATEGORIES.length}`);

  const accommodation = await prisma.department.findUniqueOrThrow({ where: { code: "HEB" } });
  const spaces = await prisma.department.findUniqueOrThrow({ where: { code: "ESP" } });

  let order = 0;
  for (const room of [...ROOMS, ...SPACES]) {
    const content = PUBLIC_CONTENT[contentKeyFor(room)];
    const departmentId = room.kind === "HALL" ? spaces.id : accommodation.id;

    const publicFields = {
      published: true,
      featured: content?.featured ?? false,
      headlineFr: content?.headlineFr ?? null,
      headlineEn: content?.headlineEn ?? null,
      descriptionFr: content?.descriptionFr ?? null,
      descriptionEn: content?.descriptionEn ?? null,
      amenities: JSON.stringify(content?.amenities ?? []),
      sortOrder: order++,
    };

    await prisma.room.upsert({
      where: { number: room.number },
      create: {
        ...room,
        slug: slugify(`${room.name} ${room.number}`),
        departmentId,
        ...publicFields,
      },
      // Re-running the seed refreshes the copy without touching photos.
      update: publicFields,
    });
  }
  console.log(`  units               ${ROOMS.length + SPACES.length}`);

  const deptByCode = new Map(
    (await prisma.department.findMany()).map((d) => [d.code, d.id]),
  );
  for (const item of SERVICE_ITEMS) {
    const { dept, ...rest } = item;
    await prisma.serviceItem.upsert({
      where: { code: item.code },
      create: { ...rest, departmentId: deptByCode.get(dept)! },
      update: { unitPrice: item.unitPrice },
    });
  }
  console.log(`  service items       ${SERVICE_ITEMS.length}`);

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

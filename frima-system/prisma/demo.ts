import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { saveClient, saveSupplier } from "../src/lib/actions/directory";
import { checkInStay, checkOutStay, createStay } from "../src/lib/actions/stays";
import { addLine, createInvoice, issueInvoice } from "../src/lib/actions/invoices";
import { recordExpense, recordPayment } from "../src/lib/actions/treasury";
import { postEntry } from "../src/lib/accounting/posting";

/**
 * Fills the database with a plausible month of trading so every screen has
 * something to show. Safe to re-run only on a freshly reset database.
 */

function fd(values: Record<string, string | number | boolean>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, String(value));
  return form;
}

function day(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function must<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function ensure(result: { ok: boolean; error?: string }, what: string) {
  if (!result.ok) throw new Error(`${what}: ${result.error}`);
}

const CLIENTS = [
  { name: "Société ABC Sarl", type: "COMPANY", phone: "+237 677 101 202", city: "Yaoundé" },
  { name: "Ngono Marie", type: "INDIVIDUAL", phone: "+237 696 334 455", city: "Douala" },
  { name: "Mbarga Jean-Paul", type: "INDIVIDUAL", phone: "+237 677 889 900", city: "Yaoundé" },
  { name: "ONG Horizon Vert", type: "COMPANY", phone: "+237 233 445 566", city: "Yaoundé" },
  { name: "Tchoumi Alain", type: "INDIVIDUAL", phone: "+237 699 221 133", city: "Bafoussam" },
];

const SUPPLIERS = [
  { name: "ENEO Cameroun", phone: "+237 233 000 111" },
  { name: "Camerounaise des Eaux", phone: "+237 233 000 222" },
  { name: "Marché Mfoundi, denrées", phone: "+237 677 445 566" },
  { name: "Camtel Internet", phone: "+237 233 000 333" },
  { name: "Hygiène Plus Sarl", phone: "+237 696 778 899" },
];

async function main() {
  console.log("Seeding a month of trading…\n");

  // Opening balance sheet: the funds the business started the period with.
  // Posted as a real entry so the treasury figures reconcile to the journal.
  const opening = new Date(`${day(-20)}T00:00:00`);
  await prisma.$transaction(async (tx) => {
    await postEntry(tx, {
      journal: "OD",
      date: opening,
      label: "Report à nouveau, situation d'ouverture",
      sourceType: "MANUAL",
      lines: [
        { accountCode: "5711", label: "Fonds de caisse", debit: 150_000 },
        { accountCode: "521", label: "Solde bancaire d'ouverture", debit: 3_000_000 },
        { accountCode: "121", label: "Report à nouveau", credit: 3_150_000 },
      ],
    });
  });

  const clientIds: string[] = [];
  for (const client of CLIENTS) {
    clientIds.push(must(await saveClient(fd(client))).id);
  }
  console.log(`  clients      ${clientIds.length}`);

  const supplierIds: string[] = [];
  for (const supplier of SUPPLIERS) {
    supplierIds.push(must(await saveSupplier(fd(supplier))).id);
  }
  console.log(`  suppliers    ${supplierIds.length}`);

  const rooms = await prisma.room.findMany({
    where: { kind: { not: "HALL" } },
    orderBy: { number: "asc" },
  });
  const breakfast = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "PDJ" } });
  const dinner = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "REST-MENU" } });
  const beer = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "BAR-BIERE" } });
  const conference = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "CONF-JOUR" } });
  const coffeeBreak = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "PAUSE-CAFE" } });

  // --- Completed stays, billed and settled --------------------------------
  const completed = [
    { room: 0, client: 0, from: -18, to: -15, breakfasts: 6, dinners: 2, beers: 4 },
    { room: 1, client: 1, from: -14, to: -12, breakfasts: 2, dinners: 1, beers: 0 },
    { room: 6, client: 2, from: -11, to: -7, breakfasts: 4, dinners: 3, beers: 6 },
    { room: 3, client: 4, from: -9, to: -6, breakfasts: 3, dinners: 0, beers: 2 },
    { room: 8, client: 0, from: -6, to: -3, breakfasts: 6, dinners: 4, beers: 8 },
  ];

  let settled = 0;
  for (const spec of completed) {
    const stayId = must(
      await createStay(
        fd({
          roomId: rooms[spec.room].id,
          clientId: clientIds[spec.client],
          checkIn: day(spec.from),
          checkOut: day(spec.to),
          adults: 2,
        }),
      ),
    ).id;

    ensure(await checkInStay(stayId), "check-in");

    const stay = await prisma.stay.findUniqueOrThrow({ where: { id: stayId } });
    const invoiceId = stay.invoiceId!;

    if (spec.breakfasts)
      ensure(await addLine(fd({ invoiceId, serviceItemId: breakfast.id, quantity: spec.breakfasts, occurredAt: day(spec.from + 1) })), "breakfast");
    if (spec.dinners)
      ensure(await addLine(fd({ invoiceId, serviceItemId: dinner.id, quantity: spec.dinners, occurredAt: day(spec.from + 1) })), "dinner");
    if (spec.beers)
      ensure(await addLine(fd({ invoiceId, serviceItemId: beer.id, quantity: spec.beers, occurredAt: day(spec.from + 1) })), "bar");

    ensure(await checkOutStay(stayId), "check-out");
    ensure(await issueInvoice(fd({ invoiceId, issuedAt: day(spec.to) })), "issue");

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    ensure(
      await recordPayment(
        fd({
          invoiceId,
          amount: invoice.total,
          method: settled % 3 === 0 ? "MOBILE_MONEY" : "CASH",
          receivedAt: day(spec.to),
          issuedBy: "Réception",
        }),
      ),
      "payment",
    );
    settled++;
  }
  console.log(`  stays billed ${settled}`);

  // --- A conference hire, part-paid ---------------------------------------
  const seminarInvoiceId = must(
    await createInvoice(fd({ clientId: clientIds[3], notes: "Séminaire annuel, 2 journées" })),
  ).id;
  ensure(await addLine(fd({ invoiceId: seminarInvoiceId, serviceItemId: conference.id, quantity: 2, occurredAt: day(-5) })), "hall");
  ensure(await addLine(fd({ invoiceId: seminarInvoiceId, serviceItemId: coffeeBreak.id, quantity: 60, occurredAt: day(-5) })), "coffee");
  ensure(await issueInvoice(fd({ invoiceId: seminarInvoiceId, issuedAt: day(-5), dueDate: day(10) })), "issue hall");
  const seminar = await prisma.invoice.findUniqueOrThrow({ where: { id: seminarInvoiceId } });
  ensure(
    await recordPayment(
      fd({
        invoiceId: seminarInvoiceId,
        amount: Math.round(seminar.total / 2),
        method: "BANK_TRANSFER",
        receivedAt: day(-5),
        issuedBy: "Direction",
      }),
    ),
    "hall deposit",
  );
  console.log("  hall hire    1 (50 % deposit)");

  // --- Guests currently in house ------------------------------------------
  const inHouse = [
    { room: 2, client: 1, from: -2, to: 2 },
    { room: 7, client: 3, from: -1, to: 3 },
  ];
  for (const spec of inHouse) {
    const stayId = must(
      await createStay(
        fd({
          roomId: rooms[spec.room].id,
          clientId: clientIds[spec.client],
          checkIn: day(spec.from),
          checkOut: day(spec.to),
          adults: 1,
        }),
      ),
    ).id;
    ensure(await checkInStay(stayId), "check-in");
    const stay = await prisma.stay.findUniqueOrThrow({ where: { id: stayId } });
    ensure(
      await addLine(fd({ invoiceId: stay.invoiceId!, serviceItemId: breakfast.id, quantity: 2, occurredAt: day(spec.from + 1) })),
      "breakfast",
    );
  }
  console.log(`  in house     ${inHouse.length}`);

  // --- Forward reservations -----------------------------------------------
  const upcoming = [
    { room: 4, client: 2, from: 2, to: 5 },
    { room: 5, client: 4, from: 4, to: 7 },
    { room: 9, client: 0, from: 6, to: 9 },
  ];
  for (const spec of upcoming) {
    must(
      await createStay(
        fd({
          roomId: rooms[spec.room].id,
          clientId: clientIds[spec.client],
          checkIn: day(spec.from),
          checkOut: day(spec.to),
          adults: 2,
        }),
      ),
    );
  }
  console.log(`  reservations ${upcoming.length}`);

  // --- Operating costs across the five cost families -----------------------
  const categories = Object.fromEntries(
    (await prisma.expenseCategory.findMany()).map((c) => [c.code, c.id]),
  );
  const departments = Object.fromEntries(
    (await prisma.department.findMany()).map((d) => [d.code, d.id]),
  );

  const costs = [
    { cat: "ENERGY", account: "6052", dept: "HEB", supplier: 0, desc: "Facture ENEO, électricité", amount: 285000, at: -16, paid: true, method: "BANK_TRANSFER" },
    { cat: "ENERGY", account: "6051", dept: "HEB", supplier: 1, desc: "Facture CDE, eau", amount: 96000, at: -16, paid: true, method: "BANK_TRANSFER" },
    { cat: "ENERGY", account: "6053", dept: "GEN", supplier: null, desc: "Carburant groupe électrogène", amount: 120000, at: -10, paid: true, method: "CASH" },
    { cat: "RAW_MATERIALS", account: "602", dept: "RES", supplier: 2, desc: "Approvisionnement denrées alimentaires", amount: 340000, at: -14, paid: true, method: "CASH" },
    { cat: "RAW_MATERIALS", account: "601", dept: "RES", supplier: 2, desc: "Boissons, bar", amount: 185000, at: -8, paid: false, method: "CASH" },
    { cat: "ADMIN", account: "628", dept: "GEN", supplier: 3, desc: "Abonnement internet mensuel", amount: 75000, at: -12, paid: true, method: "MOBILE_MONEY" },
    { cat: "ADMIN", account: "6055", dept: "GEN", supplier: null, desc: "Fournitures de bureau et encre", amount: 42000, at: -7, paid: true, method: "CASH" },
    { cat: "OPERATING_SUPPLIES", account: "604", dept: "HEB", supplier: 4, desc: "Produits d'entretien, savons, kits clients", amount: 128000, at: -9, paid: true, method: "CASH" },
    { cat: "OPERATING_SUPPLIES", account: "604", dept: "HEB", supplier: 4, desc: "Linge de lit et serviettes", amount: 210000, at: -4, paid: false, method: "BANK_TRANSFER" },
    { cat: "DIRECT_STAFF", account: "661", dept: "HEB", supplier: null, desc: "Salaires personnel hébergement", amount: 450000, at: -2, paid: true, method: "BANK_TRANSFER" },
    { cat: "DIRECT_STAFF", account: "661", dept: "RES", supplier: null, desc: "Salaires personnel restauration", amount: 320000, at: -2, paid: true, method: "BANK_TRANSFER" },
    { cat: "DIRECT_STAFF", account: "664", dept: "GEN", supplier: null, desc: "Cotisations sociales CNPS", amount: 138000, at: -2, paid: true, method: "BANK_TRANSFER" },
  ];

  for (const cost of costs) {
    ensure(
      await recordExpense(
        fd({
          categoryId: categories[cost.cat],
          expenseAccount: cost.account,
          departmentId: departments[cost.dept],
          ...(cost.supplier !== null ? { supplierId: supplierIds[cost.supplier] } : {}),
          description: cost.desc,
          amount: cost.amount,
          method: cost.method,
          incurredAt: day(cost.at),
          ...(cost.paid ? { paid: "on" } : {}),
        }),
      ),
      cost.desc,
    );
  }
  console.log(`  costs        ${costs.length}`);

  // --- Website: news posts -------------------------------------------------
  const POSTS = [
    {
      slug: "nouvelle-salle-de-conference",
      titleFr: "Notre salle de conférence rouvre après travaux",
      titleEn: "Our conference hall reopens after refurbishment",
      excerptFr:
        "Sonorisation renouvelée, climatisation revue et un nouveau vidéoprojecteur : la salle de 120 places est de nouveau disponible.",
      excerptEn:
        "New sound system, overhauled air conditioning and a new projector: the 120-seat hall is available again.",
      bodyFr:
        "La salle de conférence de FRIMA Guest Suites rouvre ses portes après plusieurs semaines de travaux.\n## Ce qui change\nLa sonorisation a été entièrement renouvelée et un vidéoprojecteur haute luminosité a été installé, lisible même en plein jour. La climatisation a été revue pour tenir une salle pleine sur une journée entière.\n## Réserver\nLes formules journée et demi-journée sont consultables sur la page Séminaires & événements, avec les tarifs à jour. L'hébergement des participants se réserve dans le même mouvement.",
      bodyEn:
        "The conference hall at FRIMA Guest Suites is open again after several weeks of work.\n## What changed\nThe sound system has been entirely replaced and a high-brightness projector installed, readable even in daylight. The air conditioning was overhauled to hold a full room through a whole day.\n## Booking\nFull-day and half-day rates are listed on the Meetings & events page. Accommodation for delegates can be booked at the same time.",
      category: "EVENTS",
      authorName: "La direction",
      daysAgo: 3,
    },
    {
      slug: "navette-aeroport-nsimalen",
      titleFr: "Navette aéroport : nouveaux horaires",
      titleEn: "Airport shuttle: new timetable",
      excerptFr:
        "Notre navette dessert désormais l'aéroport de Nsimalen pour tous les vols du matin, sur réservation la veille.",
      excerptEn:
        "Our shuttle now serves Nsimalen airport for every morning flight, booked the day before.",
      bodyFr:
        "La navette de l'établissement dessert l'aéroport international de Nsimalen, à une dizaine de minutes de route.\nPour les vols du matin, la réservation se fait la veille avant 20h auprès de la réception. Le trajet est facturé à la course et porté sur votre note de séjour.\nPour les arrivées tardives, prévenez-nous de votre numéro de vol : nous ajustons l'accueil en conséquence, la réception étant tenue 24 heures sur 24.",
      bodyEn:
        "The property shuttle serves Nsimalen International Airport, about ten minutes away.\nFor morning flights, book with reception the day before, by 8pm. The trip is charged per journey and added to your folio.\nFor late arrivals, send us your flight number. Reception is staffed around the clock and we adjust accordingly.",
      category: "NEWS",
      authorName: "Réception",
      daysAgo: 9,
    },
    {
      slug: "offre-long-sejour-studios",
      titleFr: "Offre long séjour sur les studios et appartements",
      titleEn: "Long-stay offer on studios and apartments",
      excerptFr:
        "À partir de sept nuitées consécutives, le ménage hebdomadaire et la blanchisserie sont inclus.",
      excerptEn:
        "From seven consecutive nights, weekly housekeeping and laundry are included.",
      bodyFr:
        "Nos studios et appartements meublés sont pensés pour les missions longues et les installations provisoires à Yaoundé.\n## Ce qui est compris\nÀ partir de sept nuitées consécutives, le ménage hebdomadaire et le service de blanchisserie sont inclus dans le tarif. La cuisine équipée permet de préparer ses repas, et le restaurant reste à disposition.\n## Comment en profiter\nIndiquez vos dates dans le formulaire de demande de réservation : la réception applique la formule et vous confirme le tarif.",
      bodyEn:
        "Our furnished studios and apartments are built for long assignments and temporary moves to Yaoundé.\n## What is included\nFrom seven consecutive nights, weekly housekeeping and the laundry service are included in the rate. The fitted kitchen lets you cook for yourself, and the restaurant stays available.\n## How to take it up\nEnter your dates on the booking request form and reception will apply the rate when confirming.",
      category: "OFFERS",
      authorName: "La direction",
      daysAgo: 16,
    },
    {
      slug: "nos-hebergements-en-un-coup-doeil",
      titleFr: "Nos hébergements en un coup d'œil",
      titleEn: "Our accommodation at a glance",
      excerptFr:
        "Chambres, studios et appartements : comment choisir selon la durée de votre séjour.",
      excerptEn:
        "Rooms, studios and apartments: how to choose by the length of your stay.",
      bodyFr:
        "Trois formules, selon le temps que vous passez chez nous.\n## Une à deux nuits\nLa chambre standard suffit : lit double, salle d'eau privative, climatisation et Wi-Fi, à dix minutes de l'aéroport.\n## Quelques jours de travail\nLa chambre supérieure ajoute un bureau, un réfrigérateur et un coffre-fort.\n## Une semaine et plus\nLe studio meublé et l'appartement deux chambres disposent d'une cuisine équipée et d'un espace de vie séparé.\nLes disponibilités et les tarifs du jour figurent sur la page Chambres & suites, mise à jour en direct.",
      bodyEn:
        "Three options, depending on how long you stay.\n## One or two nights\nThe standard room is enough: double bed, private bathroom, air conditioning and Wi-Fi, ten minutes from the airport.\n## A few working days\nThe superior room adds a desk, a fridge and a safe.\n## A week or more\nThe furnished studio and the two-bedroom apartment have a fitted kitchen and a separate living area.\nToday's availability and rates are on the Rooms & suites page, updated live.",
      category: "ROOMS",
      authorName: "La direction",
      daysAgo: 24,
    },
  ];

  for (const post of POSTS) {
    const publishedAt = new Date(`${day(-post.daysAgo)}T09:00:00`);
    const { daysAgo, ...rest } = post;
    void daysAgo;
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: { ...rest, published: true, publishedAt },
      update: {},
    });
  }
  console.log(`  posts        ${POSTS.length}`);

  // --- Website: booking requests awaiting reception ------------------------
  const freeRooms = await prisma.room.findMany({
    where: { kind: { not: "HALL" }, published: true },
    orderBy: { number: "asc" },
  });

  const REQUESTS = [
    {
      room: freeRooms[4],
      guestName: "Ekwalla Serge",
      guestPhone: "+237 699 884 112",
      guestEmail: "s.ekwalla@example.cm",
      from: 5,
      to: 8,
      adults: 1,
      message: "Arrivée vers 22h, vol depuis Douala.",
    },
    {
      room: freeRooms[7],
      guestName: "Awono Christelle",
      guestPhone: "+237 677 203 994",
      guestEmail: null,
      from: 9,
      to: 14,
      adults: 2,
      message: "Séjour de travail, merci de prévoir un bureau.",
    },
  ];

  let requestNo = 0;
  for (const request of REQUESTS) {
    if (!request.room) continue;
    requestNo++;
    await prisma.bookingRequest.create({
      data: {
        reference: `DEM-${new Date().getFullYear()}-${String(requestNo).padStart(4, "0")}`,
        roomId: request.room.id,
        guestName: request.guestName,
        guestPhone: request.guestPhone,
        guestEmail: request.guestEmail,
        guestCountry: "Cameroun",
        checkIn: new Date(`${day(request.from)}T00:00:00`),
        checkOut: new Date(`${day(request.to)}T00:00:00`),
        adults: request.adults,
        message: request.message,
        status: "PENDING",
      },
    });
  }
  await prisma.sequence.upsert({
    where: { key: `BOOKING:${new Date().getFullYear()}` },
    create: { key: `BOOKING:${new Date().getFullYear()}`, value: requestNo },
    update: { value: requestNo },
  });
  console.log(`  requests     ${requestNo}`);

  const entries = await prisma.journalEntry.count();
  const totals = await prisma.journalLine.aggregate({ _sum: { debit: true, credit: true } });
  console.log(
    `\n  journal entries ${entries} · debit ${totals._sum.debit} = credit ${totals._sum.credit} ${
      totals._sum.debit === totals._sum.credit ? "✓" : "✗"
    }\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

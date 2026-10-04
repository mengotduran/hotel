import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { saveClient } from "../src/lib/actions/directory";
import { cancelStay, checkInStay, checkOutStay, createStay } from "../src/lib/actions/stays";
import { addLine, issueInvoice } from "../src/lib/actions/invoices";
import { cancelPayment, recordExpense, recordPayment } from "../src/lib/actions/treasury";
import { profitAndLoss, accountBalance, monthBounds, occupancySnapshot, dailyCashStatement } from "../src/lib/reporting";
import { ACC } from "../src/lib/accounting/chart";
import { amountInWords } from "../src/lib/money";
import { publicRooms } from "../src/lib/availability";
import {
  confirmBookingRequest, declineBookingRequest, lookupBooking, submitBookingRequest,
} from "../src/lib/actions/bookings";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(label: string, actual: unknown, expected: unknown) {
  check(label, Object.is(actual, expected), `got ${actual}, expected ${expected}`);
}

/** Dates are expressed relative to today so check-in/check-out run the
 *  same path they would at the front desk. */
function dayOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ARRIVAL = dayOffset(-3);
const DEPARTURE = dayOffset(0);
const YEAR = new Date().getFullYear();

function fd(values: Record<string, string | number | boolean>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, String(value));
  }
  return form;
}

/** The books are only trustworthy if every entry nets to zero. */
async function assertJournalBalanced(label: string) {
  const totals = await prisma.journalLine.aggregate({
    _sum: { debit: true, credit: true },
  });
  eq(`${label}: journal balanced`, totals._sum.debit, totals._sum.credit);

  const entries = await prisma.journalEntry.findMany({ include: { lines: true } });
  const broken = entries.filter((entry) => {
    const d = entry.lines.reduce((s, l) => s + l.debit, 0);
    const c = entry.lines.reduce((s, l) => s + l.credit, 0);
    return d !== c;
  });
  eq(`${label}: every entry balanced`, broken.length, 0);
}

async function main() {
  console.log(`\nDatabase: ${process.env.DATABASE_URL}\n`);

  // -- Amounts in words ----------------------------------------------------
  // A receipt is a legal document, so the French agreement rules for
  // vingt/cent and the "de francs" form have to hold exactly.
  console.log("Amounts in words");
  const spellings: [number, string][] = [
    [1, "Un franc CFA"],
    [21, "Vingt et un francs CFA"],
    [71, "Soixante et onze francs CFA"],
    [80, "Quatre-vingts francs CFA"],
    [81, "Quatre-vingt-un francs CFA"],
    [200, "Deux cents francs CFA"],
    [1_000, "Mille francs CFA"],
    [80_000, "Quatre-vingt mille francs CFA"],
    [200_000, "Deux cent mille francs CFA"],
    [489_000, "Quatre cent quatre-vingt-neuf mille francs CFA"],
    [1_000_000, "Un million de francs CFA"],
    [2_500_000, "Deux millions cinq cent mille francs CFA"],
    [200_000_000, "Deux cents millions de francs CFA"],
  ];
  for (const [value, expected] of spellings) {
    eq(`${value} in words`, amountInWords(value, "fr"), expected);
  }

  // -- Reference data ------------------------------------------------------
  console.log("Reference data");
  const departments = await prisma.department.findMany();
  const heb = departments.find((d) => d.code === "HEB")!;
  const res = departments.find((d) => d.code === "RES")!;
  eq("4 departments seeded", departments.length, 4);
  eq("accommodation posts to 7061", heb.revenueAccount, "7061");

  const vat = Number((await prisma.setting.findUniqueOrThrow({ where: { key: "finance.vatRate" } })).value);
  eq("VAT rate is the Cameroon 19.25 %", vat, 19.25);

  // -- Client --------------------------------------------------------------
  console.log("\nClient");
  const clientResult = await saveClient(fd({ name: "Société ABC Sarl", type: "COMPANY", phone: "+237 677 000 111" }));
  check("client created", clientResult.ok);
  if (!clientResult.ok) throw new Error(clientResult.error);
  const clientId = clientResult.data.id;
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  eq("client code allocated", client.code, "CLI-0001");

  // -- Stay ----------------------------------------------------------------
  console.log("\nStay");
  const room = await prisma.room.findUniqueOrThrow({ where: { number: "101" } });
  const stayResult = await createStay(fd({
    roomId: room.id, clientId,
    checkIn: ARRIVAL, checkOut: DEPARTURE,
    adults: 2, children: 0,
  }));
  check("stay created", stayResult.ok);
  if (!stayResult.ok) throw new Error(stayResult.error);
  const stayId = stayResult.data.id;

  const clash = await createStay(fd({
    roomId: room.id, clientId,
    checkIn: dayOffset(-1), checkOut: dayOffset(2),
  }));
  check("overlapping stay rejected", !clash.ok);

  const adjacent = await createStay(fd({
    roomId: room.id, clientId,
    checkIn: DEPARTURE, checkOut: dayOffset(1),
  }));
  check("back-to-back stay allowed", adjacent.ok);
  if (adjacent.ok) await cancelStay(adjacent.data.id);

  check("check-in", (await checkInStay(stayId)).ok);
  const afterCheckIn = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
  eq("room marked occupied", afterCheckIn.status, "OCCUPIED");

  const occupancy = await occupancySnapshot(new Date(`${dayOffset(-2)}T12:00:00`));
  eq("one unit occupied", occupancy.occupied, 1);
  eq("halls excluded from lettable units", occupancy.lettable, 10);

  // -- Folio ---------------------------------------------------------------
  console.log("\nFolio");
  const stay = await prisma.stay.findUniqueOrThrow({ where: { id: stayId } });
  const invoiceId = stay.invoiceId!;
  check("folio opened at check-in", Boolean(invoiceId));

  let invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }, include: { lines: true },
  });
  eq("accommodation line present", invoice.lines.length, 1);
  eq("3 nights charged", invoice.lines[0].quantity, 3);
  eq("folio total is VAT-inclusive 75 000", invoice.total, 75000);
  eq("net of VAT", invoice.subtotal, Math.round(75000 / 1.1925));
  eq("VAT split adds back to gross", invoice.subtotal + invoice.taxTotal, 75000);

  const breakfast = await prisma.serviceItem.findUniqueOrThrow({ where: { code: "PDJ" } });
  check("breakfast added", (await addLine(fd({
    invoiceId, serviceItemId: breakfast.id, quantity: 6, occurredAt: dayOffset(-2),
  }))).ok);

  check("check-out", (await checkOutStay(stayId)).ok);
  const afterCheckOut = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
  eq("room sent to housekeeping", afterCheckOut.status, "CLEANING");

  invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }, include: { lines: true },
  });
  eq("folio has both lines after check-out", invoice.lines.length, 2);
  eq("folio total", invoice.total, 75000 + 6 * 3500);

  // -- Issue ---------------------------------------------------------------
  console.log("\nInvoice issue");
  const beforeIssue = await prisma.journalEntry.count();
  check("invoice issued", (await issueInvoice(fd({ invoiceId, issuedAt: DEPARTURE }))).ok);
  eq("one sales entry posted", (await prisma.journalEntry.count()) - beforeIssue, 1);

  invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }, include: { lines: true },
  });
  eq("status issued", invoice.status, "ISSUED");

  const salesEntry = await prisma.journalEntry.findFirstOrThrow({
    where: { sourceType: "INVOICE", sourceId: invoiceId }, include: { lines: true },
  });
  eq("posted to the sales journal", salesEntry.journal, "VT");
  eq("client debited with the gross", salesEntry.lines.find((l) => l.accountCode === ACC.clients)?.debit, invoice.total);

  const accommodationLine = salesEntry.lines.find((l) => l.accountCode === "7061");
  const fnbLine = salesEntry.lines.find((l) => l.accountCode === "7062");
  check("accommodation revenue tagged to its department", accommodationLine?.departmentId === heb.id);
  check("F&B revenue tagged to its department", fnbLine?.departmentId === res.id);
  eq("VAT collected credited", salesEntry.lines.find((l) => l.accountCode === ACC.vatOnSales)?.credit, invoice.taxTotal);

  await assertJournalBalanced("after issue");
  eq("receivable equals the invoice", await accountBalance(ACC.clients), invoice.total);

  // -- Payment -------------------------------------------------------------
  console.log("\nCollection and receipt");
  const overpay = await recordPayment(fd({
    invoiceId, amount: invoice.total + 1000, method: "CASH", receivedAt: DEPARTURE,
  }));
  check("overpayment rejected", !overpay.ok);

  const partial = await recordPayment(fd({
    invoiceId, amount: 50000, method: "CASH", receivedAt: DEPARTURE,
  }));
  check("partial collection accepted", partial.ok);
  if (!partial.ok) throw new Error(partial.error);
  eq("first receipt number", partial.data.receiptNumber, `REC-${YEAR}-00001`);

  invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
  eq("status partially paid", invoice.status, "PARTIALLY_PAID");

  const balance = await recordPayment(fd({
    invoiceId, amount: invoice.total - invoice.paidTotal, method: "MOBILE_MONEY", receivedAt: DEPARTURE,
  }));
  check("balancing collection accepted", balance.ok);
  if (!balance.ok) throw new Error(balance.error);
  eq("receipt numbers run in sequence", balance.data.receiptNumber, `REC-${YEAR}-00002`);

  invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
  eq("status paid", invoice.status, "PAID");
  eq("receivable cleared", await accountBalance(ACC.clients), 0);
  eq("cash account holds the cash leg", await accountBalance(ACC.cash), 50000);
  eq("mobile money holds the rest", await accountBalance(ACC.mobileMoney), invoice.total - 50000);

  const receipt = await prisma.receipt.findUniqueOrThrow({ where: { number: `REC-${YEAR}-00001` } });
  eq("amount spelled out in French", receipt.amountInWords, "Cinquante mille francs CFA");

  await assertJournalBalanced("after collections");

  // -- Expense -------------------------------------------------------------
  console.log("\nDisbursement");
  const energy = await prisma.expenseCategory.findUniqueOrThrow({ where: { code: "ENERGY" } });
  check("energy cost recorded", (await recordExpense(fd({
    categoryId: energy.id, departmentId: heb.id, description: "Facture ENEO octobre",
    amount: 180000, method: "CASH", paid: "on", incurredAt: DEPARTURE,
  }))).ok);

  const credit = await prisma.supplier.findFirst();
  const unpaidNoSupplier = await recordExpense(fd({
    categoryId: energy.id, description: "Sans fournisseur", amount: 1000, method: "CASH", incurredAt: DEPARTURE,
  }));
  check("unpaid charge without a supplier rejected", !unpaidNoSupplier.ok);
  void credit;

  await assertJournalBalanced("after disbursement");
  eq("cash reduced by the disbursement", await accountBalance(ACC.cash), 50000 - 180000);

  // -- Reporting -----------------------------------------------------------
  console.log("\nReporting");
  const period = monthBounds(new Date(`${DEPARTURE}T12:00:00`));
  const pl = await profitAndLoss(period);
  eq("revenue is the net of VAT", pl.revenue, invoice.subtotal);
  eq("expenses recognised", pl.expenses, 180000);
  eq("margin", pl.margin, invoice.subtotal - 180000);

  const statement = await dailyCashStatement(new Date(`${DEPARTURE}T12:00:00`));
  eq("two collections on the day", statement.payments.length, 2);
  eq("inflow matches the invoice", statement.inflow, invoice.total);
  eq("disbursement settled the same day", statement.outflow, 180000);

  // -- Cancellation --------------------------------------------------------
  console.log("\nCancellation and reversal");
  const paymentToCancel = await prisma.payment.findUniqueOrThrow({ where: { id: partial.data.paymentId } });
  check("collection cancelled", (await cancelPayment(paymentToCancel.id, "Erreur de saisie")).ok);

  const cancelledReceipt = await prisma.receipt.findUniqueOrThrow({ where: { number: `REC-${YEAR}-00001` } });
  check("receipt marked cancelled, not deleted", cancelledReceipt.cancelled);
  eq("receipt kept in the sequence", await prisma.receipt.count(), 2);

  invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
  eq("invoice back to partially paid", invoice.status, "PARTIALLY_PAID");
  eq("receivable reopened", await accountBalance(ACC.clients), 50000);
  eq("cash leg reversed", await accountBalance(ACC.cash), -180000);

  await assertJournalBalanced("after reversal");

  const reversal = await prisma.journalEntry.findFirst({ where: { reversalOf: { not: null } } });
  check("reversal posted as a new entry", Boolean(reversal));

  // -- Public website ------------------------------------------------------
  console.log("\nPublic website");

  const siteRoom = await prisma.room.findUniqueOrThrow({ where: { number: "203" } });
  eq("units are published by the seed", siteRoom.published, true);

  const siteRange = { checkIn: new Date(`${dayOffset(20)}T00:00:00`), checkOut: new Date(`${dayOffset(23)}T00:00:00`) };
  const listed = await publicRooms(siteRange);
  eq("every published unit is listed", listed.length, 13);
  check(
    "halls are listed too — they are sold by the day",
    listed.some((room) => room.kind === "HALL"),
  );
  check("every listed unit has a public address", listed.every((room) => room.slug.length > 0));
  check(
    "a free unit reads as available",
    listed.find((r) => r.id === siteRoom.id)?.availability === "AVAILABLE",
  );

  // A unit taken out of service disappears from public availability.
  await prisma.room.update({ where: { id: siteRoom.id }, data: { status: "MAINTENANCE" } });
  const duringMaintenance = await publicRooms(siteRange);
  eq(
    "a unit under maintenance is not bookable",
    duringMaintenance.find((r) => r.id === siteRoom.id)?.availability,
    "UNAVAILABLE",
  );
  await prisma.room.update({ where: { id: siteRoom.id }, data: { status: "AVAILABLE" } });

  // An unpublished unit is invisible to guests but still usable at the desk.
  await prisma.room.update({ where: { id: siteRoom.id }, data: { published: false } });
  const whileUnpublished = await publicRooms(siteRange);
  check(
    "an unpublished unit is hidden from the site",
    !whileUnpublished.some((r) => r.id === siteRoom.id),
  );
  await prisma.room.update({ where: { id: siteRoom.id }, data: { published: true } });

  // -- Booking request lifecycle -------------------------------------------
  console.log("\nBooking requests");

  const oversize = await submitBookingRequest(fd({
    roomSlug: siteRoom.slug,
    guestName: "Trop de monde",
    guestPhone: "+237 600 000 000",
    checkIn: dayOffset(20),
    checkOut: dayOffset(23),
    adults: siteRoom.capacity + 3,
  }));
  check("a request over the unit's capacity is rejected", !oversize.ok);

  const noPhone = await submitBookingRequest(fd({
    roomSlug: siteRoom.slug,
    guestName: "Sans téléphone",
    guestPhone: "",
    checkIn: dayOffset(20),
    checkOut: dayOffset(23),
  }));
  check("a request without a phone number is rejected", !noPhone.ok);

  const request = await submitBookingRequest(fd({
    roomSlug: siteRoom.slug,
    guestName: "Ngo Bassong Hélène",
    guestPhone: "+237 695 112 334",
    guestEmail: "helene@example.cm",
    checkIn: dayOffset(20),
    checkOut: dayOffset(23),
    adults: 2,
    message: "Arrivée tardive.",
  }));
  check("a valid request is accepted", request.ok);
  if (!request.ok) throw new Error(request.error);
  eq("request reference allocated", request.data.reference, `DEM-${YEAR}-0001`);

  const pendingRow = await prisma.bookingRequest.findUniqueOrThrow({
    where: { reference: request.data.reference },
  });
  eq("request starts pending", pendingRow.status, "PENDING");
  eq("no stay created yet", pendingRow.stayId, null);

  // The whole point of request-to-book: the unit stays open to everyone.
  const stillListed = await publicRooms(siteRange);
  eq(
    "a pending request does not hold the unit",
    stillListed.find((r) => r.id === siteRoom.id)?.availability,
    "AVAILABLE",
  );

  const tracked = await lookupBooking(request.data.reference);
  check("a guest can look the request up", tracked.ok);

  const staysBefore = await prisma.stay.count();
  const clientsBefore = await prisma.client.count();

  check("reception confirms the request", (await confirmBookingRequest(pendingRow.id)).ok);

  eq("a reservation was created", (await prisma.stay.count()) - staysBefore, 1);
  eq("a client record was created", (await prisma.client.count()) - clientsBefore, 1);

  const confirmed = await prisma.bookingRequest.findUniqueOrThrow({
    where: { id: pendingRow.id },
    include: { room: true },
  });
  eq("request marked confirmed", confirmed.status, "CONFIRMED");
  check("request linked to its stay", Boolean(confirmed.stayId));

  const createdStay = await prisma.stay.findUniqueOrThrow({
    where: { id: confirmed.stayId! },
  });
  eq("stay carries the room's rate", createdStay.nightlyRate, siteRoom.baseRate);
  eq("stay is reserved, not checked in", createdStay.status, "RESERVED");

  // Now — and only now — the unit leaves public availability.
  const afterConfirm = await publicRooms(siteRange);
  eq(
    "the unit is no longer bookable online",
    afterConfirm.find((r) => r.id === siteRoom.id)?.availability,
    "BOOKED",
  );

  check("a confirmed request cannot be confirmed twice", !(await confirmBookingRequest(pendingRow.id)).ok);

  // A second request for the same dates can no longer be honoured.
  const clashRequest = await submitBookingRequest(fd({
    roomSlug: siteRoom.slug,
    guestName: "Second demandeur",
    guestPhone: "+237 695 999 888",
    checkIn: dayOffset(21),
    checkOut: dayOffset(22),
    adults: 1,
  }));
  check("a clashing request is still accepted (reception arbitrates)", clashRequest.ok);
  if (clashRequest.ok) {
    const clashRow = await prisma.bookingRequest.findUniqueOrThrow({
      where: { reference: clashRequest.data.reference },
    });
    check(
      "but it cannot be confirmed onto a taken unit",
      !(await confirmBookingRequest(clashRow.id)).ok,
    );
    check(
      "and it can be declined with a reason",
      (await declineBookingRequest(clashRow.id, "Unité déjà attribuée")).ok,
    );
    const declined = await prisma.bookingRequest.findUniqueOrThrow({ where: { id: clashRow.id } });
    eq("declined status recorded", declined.status, "DECLINED");
    eq("decline reason kept", declined.declineReason, "Unité déjà attribuée");
  }

  const unknown = await lookupBooking("DEM-1999-9999");
  check("an unknown reference is reported, not crashed", !unknown.ok);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("\nTest run crashed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

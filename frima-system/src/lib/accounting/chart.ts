/**
 * Chart of accounts, SYSCOHADA révisé (the accounting framework in force in
 * Cameroon and the rest of the OHADA zone). Only the accounts this property
 * actually moves are seeded; the structure follows the official classes.
 */

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface ChartAccount {
  code: string;
  nameFr: string;
  nameEn: string;
  type: AccountType;
  klass: number;
}

export const CHART_OF_ACCOUNTS: ChartAccount[] = [
  // Class 1 - Ressources durables
  { code: "101", nameFr: "Capital social", nameEn: "Share capital", type: "EQUITY", klass: 1 },
  { code: "121", nameFr: "Report à nouveau créditeur", nameEn: "Retained earnings", type: "EQUITY", klass: 1 },
  { code: "131", nameFr: "Résultat net de l'exercice", nameEn: "Net result for the period", type: "EQUITY", klass: 1 },

  // Class 2 - Immobilisations
  { code: "231", nameFr: "Bâtiments industriels, agricoles et commerciaux", nameEn: "Buildings", type: "ASSET", klass: 2 },
  { code: "2441", nameFr: "Mobilier de bureau", nameEn: "Office furniture", type: "ASSET", klass: 2 },
  { code: "2444", nameFr: "Matériel et mobilier d'hébergement", nameEn: "Accommodation furniture and equipment", type: "ASSET", klass: 2 },

  // Class 3 - Stocks
  { code: "311", nameFr: "Marchandises", nameEn: "Goods for resale", type: "ASSET", klass: 3 },
  { code: "321", nameFr: "Matières premières", nameEn: "Raw materials", type: "ASSET", klass: 3 },
  { code: "331", nameFr: "Matières consommables", nameEn: "Consumable supplies", type: "ASSET", klass: 3 },

  // Class 4 - Tiers
  { code: "401", nameFr: "Fournisseurs, dettes en compte", nameEn: "Trade payables", type: "LIABILITY", klass: 4 },
  { code: "411", nameFr: "Clients", nameEn: "Trade receivables", type: "ASSET", klass: 4 },
  { code: "4191", nameFr: "Clients, avances et acomptes reçus", nameEn: "Customer advances received", type: "LIABILITY", klass: 4 },
  { code: "422", nameFr: "Personnel, rémunérations dues", nameEn: "Staff remuneration payable", type: "LIABILITY", klass: 4 },
  { code: "431", nameFr: "Sécurité sociale (CNPS)", nameEn: "Social security (CNPS)", type: "LIABILITY", klass: 4 },
  { code: "4431", nameFr: "État, TVA facturée sur ventes", nameEn: "VAT charged on sales", type: "LIABILITY", klass: 4 },
  { code: "4452", nameFr: "État, TVA récupérable sur achats", nameEn: "Recoverable VAT on purchases", type: "ASSET", klass: 4 },
  { code: "4471", nameFr: "État, taxe de séjour à reverser", nameEn: "Tourism tax payable", type: "LIABILITY", klass: 4 },

  // Class 5 - Trésorerie
  { code: "521", nameFr: "Banques locales", nameEn: "Local banks", type: "ASSET", klass: 5 },
  { code: "531", nameFr: "Établissements financiers · Mobile Money", nameEn: "Financial institutions · Mobile Money", type: "ASSET", klass: 5 },
  { code: "5711", nameFr: "Caisse en francs CFA", nameEn: "Cash on hand (XAF)", type: "ASSET", klass: 5 },

  // Class 6 - Charges des activités ordinaires
  { code: "601", nameFr: "Achats de marchandises", nameEn: "Purchases of goods for resale", type: "EXPENSE", klass: 6 },
  { code: "602", nameFr: "Achats de matières premières et fournitures liées", nameEn: "Purchases of raw materials", type: "EXPENSE", klass: 6 },
  { code: "604", nameFr: "Achats stockés de matières et fournitures consommables", nameEn: "Purchases of consumable supplies", type: "EXPENSE", klass: 6 },
  { code: "6051", nameFr: "Fournitures non stockables · Eau", nameEn: "Utilities · Water", type: "EXPENSE", klass: 6 },
  { code: "6052", nameFr: "Fournitures non stockables · Électricité", nameEn: "Utilities · Electricity", type: "EXPENSE", klass: 6 },
  { code: "6053", nameFr: "Fournitures non stockables · Carburant", nameEn: "Utilities · Fuel", type: "EXPENSE", klass: 6 },
  { code: "6055", nameFr: "Fournitures de bureau", nameEn: "Office supplies", type: "EXPENSE", klass: 6 },
  { code: "622", nameFr: "Locations et charges locatives", nameEn: "Rent and rental charges", type: "EXPENSE", klass: 6 },
  { code: "624", nameFr: "Entretien, réparations et maintenance", nameEn: "Repairs and maintenance", type: "EXPENSE", klass: 6 },
  { code: "625", nameFr: "Primes d'assurance", nameEn: "Insurance premiums", type: "EXPENSE", klass: 6 },
  { code: "627", nameFr: "Publicité, publications, relations publiques", nameEn: "Advertising and public relations", type: "EXPENSE", klass: 6 },
  { code: "628", nameFr: "Frais de télécommunications", nameEn: "Telecommunications (internet, phone)", type: "EXPENSE", klass: 6 },
  { code: "631", nameFr: "Frais bancaires", nameEn: "Bank charges", type: "EXPENSE", klass: 6 },
  { code: "638", nameFr: "Autres charges externes", nameEn: "Other external charges", type: "EXPENSE", klass: 6 },
  { code: "641", nameFr: "Impôts et taxes directs", nameEn: "Direct taxes and duties", type: "EXPENSE", klass: 6 },
  { code: "661", nameFr: "Rémunérations directes versées au personnel national", nameEn: "Direct staff remuneration", type: "EXPENSE", klass: 6 },
  { code: "664", nameFr: "Charges sociales", nameEn: "Social security contributions", type: "EXPENSE", klass: 6 },
  { code: "681", nameFr: "Dotations aux amortissements d'exploitation", nameEn: "Depreciation charges", type: "EXPENSE", klass: 6 },

  // Class 7 - Produits des activités ordinaires
  { code: "7061", nameFr: "Hébergement · ventes de nuitées", nameEn: "Accommodation · room night sales", type: "REVENUE", klass: 7 },
  { code: "7062", nameFr: "Restauration · gastronomie, bar, petit-déjeuner", nameEn: "Food & beverage · restaurant, bar, breakfast", type: "REVENUE", klass: 7 },
  { code: "7063", nameFr: "Location de salles et espaces", nameEn: "Hall and space rental", type: "REVENUE", klass: 7 },
  { code: "7068", nameFr: "Autres services vendus", nameEn: "Other services sold", type: "REVENUE", klass: 7 },
  { code: "707", nameFr: "Produits accessoires", nameEn: "Ancillary income", type: "REVENUE", klass: 7 },
];

/** Accounts the posting engine refers to by name rather than by literal code. */
export const ACC = {
  clients: "411",
  clientAdvances: "4191",
  suppliers: "401",
  vatOnSales: "4431",
  vatOnPurchases: "4452",
  tourismTaxPayable: "4471",
  cash: "5711",
  bank: "521",
  mobileMoney: "531",
  otherServices: "7068",
} as const;

export type PaymentMethod =
  | "CASH"
  | "MOBILE_MONEY"
  | "BANK_TRANSFER"
  | "CARD"
  | "CHEQUE";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "MOBILE_MONEY",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
];

/** Which treasury account a payment method lands in, and in which journal. */
export function treasuryFor(method: PaymentMethod): {
  account: string;
  journal: "CA" | "BQ";
} {
  switch (method) {
    case "CASH":
      return { account: ACC.cash, journal: "CA" };
    case "MOBILE_MONEY":
      return { account: ACC.mobileMoney, journal: "BQ" };
    default:
      return { account: ACC.bank, journal: "BQ" };
  }
}

/** Treasury methods that move physical cash · these drive the cash book. */
export function isCashMethod(method: string): boolean {
  return method === "CASH";
}

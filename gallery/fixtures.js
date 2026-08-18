/* Every number the gallery shows. Fixed, so figures and evals are reproducible.
 *
 * Nothing here is real data about a real person or company. The loan offers,
 * flights, and services are constructed so the teardowns in the book have
 * something concrete to argue about.
 */

export const PRINCIPAL = 30000;

export const OFFERS = [
  { lender: "Northbank", apr: 6.24, termMonths: 60, fees: 0 },
  { lender: "Cedar Credit Union", apr: 4.35, termMonths: 60, fees: 1400 },
  { lender: "Harbor Direct", apr: 5.6, termMonths: 60, fees: 500 },
];

export const FLIGHTS = [
  { number: "UA 512", depart: "07:15", arrive: "15:42", stops: "nonstop", duration: "5h 27m",
    aircraft: "757-200", cabin: "Economy", fare: 318, bags: 1, co2: 412, cheapest: true },
  { number: "B6 916", depart: "10:40", arrive: "19:02", stops: "nonstop", duration: "5h 22m",
    aircraft: "A321", cabin: "Economy", fare: 344, bags: 1, co2: 388, fastest: true },
  { number: "AA 84", depart: "16:05", arrive: "00:31", stops: "nonstop", duration: "5h 26m",
    aircraft: "777-200", cabin: "Economy", fare: 351, bags: 1, co2: 455 },
];

export const EXPENSE_DRAFT = {
  employeeId: "E-40122",
  costCentre: "CC-ENG-7",
  merchant: "Blue Bottle Coffee",
  date: "2026-08-14",
  amount: 62.4,
  currency: "USD",
  category: "Meals",
};

export const OPS = {
  state: "degraded",
  headline: "Checkout is slow, nothing is down",
  because: "One dependency is timing out on 4% of calls. Everything else is nominal.",
  asOf: "09:41 UTC",
  headliners: [
    { label: "error rate", value: "4.1%", alarming: true },
    { label: "p99 latency", value: "2.4s", alarming: true },
    { label: "requests/min", value: "18.2k" },
  ],
  services: [
    { name: "checkout", errorRate: 4.1, p99: 2410 },
    { name: "catalog", errorRate: 0.2, p99: 190 },
    { name: "payments", errorRate: 0.0, p99: 240 },
    { name: "search", errorRate: 0.1, p99: 320 },
  ],
  metrics: [
    { label: "req/min", value: "18.2k" }, { label: "errors", value: "4.1%" },
    { label: "p50", value: "180ms" }, { label: "p95", value: "1.2s" },
    { label: "p99", value: "2.4s" }, { label: "cpu", value: "62%" },
    { label: "mem", value: "71%" }, { label: "queue", value: "1.4k" },
    { label: "cache", value: "88%" }, { label: "pods", value: "24" },
    { label: "restarts", value: "2" }, { label: "cost/hr", value: "$41" },
  ],
};

export const CONTRACT = {
  documentUrl: "https://example.invalid/contracts/msa-2026.pdf",
  pageText:
    "This Master Services Agreement is entered into as of the Effective Date by and between the parties identified in the signature block below, and governs all Statements of Work executed thereunder. ",
  matches: [
    {
      page: 41,
      heading: "7.3 Termination for convenience",
      html:
        "Either party may terminate this Agreement for convenience upon <mark>ninety (90) days</mark> " +
        "prior written notice. Fees paid in advance for the terminated period shall be " +
        "<mark>refunded pro rata</mark> within thirty (30) days of the effective termination date.",
      plain:
        "Either party may terminate for convenience on 90 days written notice. " +
        "Prepaid fees are refunded pro rata within 30 days.",
    },
    {
      page: 42,
      heading: "7.4 Termination for cause",
      html:
        "Either party may terminate immediately upon a material breach that remains uncured " +
        "<mark>thirty (30) days</mark> after written notice describing the breach in reasonable detail.",
      plain: "Immediate termination for material breach uncured after 30 days notice.",
    },
    {
      page: 58,
      heading: "12.1 Effect of termination",
      html:
        "Upon termination, each party shall <mark>return or destroy</mark> the other party's " +
        "Confidential Information, except copies retained in routine backups.",
      plain: "On termination each party returns or destroys confidential information.",
    },
  ],
};

export const DEPLOY = {
  release: "api-2026.8.14",
  startedAt: "09:22 UTC",
  asOf: "09:26 UTC",
  phase: "running",
  summary: "Canary at 10% for 4 minutes. Error rate matches baseline.",
  steps: [
    { name: "build", state: "done", detail: "1m 12s" },
    { name: "tests", state: "done", detail: "208 passed" },
    { name: "canary 10%", state: "running", detail: "4m elapsed" },
    { name: "full rollout", state: "pending" },
    { name: "smoke checks", state: "pending" },
  ],
};

export const BUDGET = {
  cap: 120000,
  allocation: [
    { name: "Engineering", amount: 62000 },
    { name: "Marketing", amount: 28000 },
    { name: "Support", amount: 18000 },
    { name: "Travel", amount: 6000 },
  ],
};

/* Total cost of ownership, computed once on the server so the widget and the
 * text answer cannot disagree.
 *
 * "Cost over N years" means: the fees you paid up front, plus every payment
 * made in those N years, plus whatever you still owe at the end of them. That
 * last term is the one people forget, and it is why a longer term with a lower
 * monthly payment is not automatically cheaper.
 */
export function monthlyPayment(offer, principal = PRINCIPAL) {
  const r = offer.apr / 1200;
  return (principal * r) / (1 - Math.pow(1 + r, -offer.termMonths));
}

export function balanceAfter(offer, months, principal = PRINCIPAL) {
  if (months >= offer.termMonths) return 0;
  const r = offer.apr / 1200;
  const m = monthlyPayment(offer, principal);
  return principal * Math.pow(1 + r, months) - (m * (Math.pow(1 + r, months) - 1)) / r;
}

export function totalOver(offer, years, principal = PRINCIPAL) {
  const months = Math.min(Math.round(years * 12), offer.termMonths);
  return Math.round(
    offer.fees + monthlyPayment(offer, principal) * months + balanceAfter(offer, months, principal)
  );
}

/* Every horizon the slider can select, precomputed. The app does no arithmetic
 * of its own, which is one fewer place for the two users to be told different
 * things. */
export function priceOffers(offers = OFFERS, principal = PRINCIPAL) {
  return offers.map((o) => {
    const totals = {};
    for (let y = 1; y <= 10; y++) totals[y] = totalOver(o, y, principal);
    return {
      lender: o.lender,
      apr: o.apr,
      fees: o.fees,
      termMonths: o.termMonths,
      monthly: Math.round(monthlyPayment(o, principal) * 100) / 100,
      totals,
    };
  });
}

export function rankOffers(years, offers = OFFERS, principal = PRINCIPAL) {
  return priceOffers(offers, principal)
    .map((o) => ({ ...o, total: o.totals[years] }))
    .sort((a, b) => a.total - b.total);
}

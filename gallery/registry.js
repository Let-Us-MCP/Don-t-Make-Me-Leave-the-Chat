/* The gallery's app registry.
 *
 * One entry per tool. Each entry is either plain (text only, no UI) or an app
 * (a tool carrying `_meta.ui.resourceUri`, plus the `ui://` resource that
 * backs it). The before/after pairs exist so the book's teardowns are runnable
 * rather than described.
 */

import {
  BUDGET, CONTRACT, DEPLOY, EXPENSE_DRAFT, FLIGHTS, OFFERS, OPS,
  priceOffers, rankOffers,
} from "./fixtures.js";

function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export const APPS = [
  // --- Chapter 1's hero: one task, three ways -----------------------------
  {
    name: "compare_rates_text",
    archetype: "prose",
    variant: "prose",
    title: "Compare loan rates (text)",
    description:
      "Compare the loan offers already discussed and say which costs least over a " +
      "given number of years. Returns a written answer with no user interface. " +
      "Use when the user wants the answer stated rather than something to adjust.",
    inputSchema: {
      type: "object",
      properties: {
        horizonYears: {
          type: "integer", minimum: 1, maximum: 10, default: 5,
          description: "How many years to compare total cost over.",
        },
      },
    },
    run({ horizonYears = 5 }) {
      const ranked = rankOffers(horizonYears);
      const lines = ranked.map(
        (o, i) =>
          `${i === 0 ? "*" : " "} ${o.lender}: ${money(o.total)} over ${horizonYears} years ` +
          `(${o.apr.toFixed(2)}% APR, ${money(o.monthly)}/mo, ${money(o.fees)} fees)`
      );
      const best = ranked[0];
      return {
        content: [
          {
            type: "text",
            text:
              `Over ${horizonYears} years, ${best.lender} costs least at ${money(best.total)}, ` +
              `including fees and any balance still owed at the end.\n\n` +
              lines.join("\n") +
              `\n\nThe ranking changes with the horizon: ${ranked.length > 1 ? "Northbank is cheapest for the first three years, Cedar Credit Union from year four on." : ""}`,
          },
        ],
        structuredContent: { horizonYears, ranked },
      };
    },
  },
  {
    name: "compare_rates_suite",
    archetype: "comparison",
    variant: "before",
    title: "Loan analytics suite",
    description:
      "Open the loan analytics suite to compare offers, view amortization schedules, " +
      "run sensitivity analysis, and export results.",
    ui: "rate-compare/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      const offers = priceOffers();
      return {
        content: [{ type: "text", text: "Loan analytics suite opened." }],
        structuredContent: { offers: OFFERS.map((o, i) => ({ ...o, monthly: offers[i].monthly })) },
      };
    },
  },
  {
    name: "compare_rates",
    archetype: "comparison",
    variant: "after",
    title: "Compare loan rates",
    description:
      "Show a comparison of the loan offers under discussion, ranked by total cost " +
      "over a horizon the user can adjust. Use when the user asks which loan is " +
      "cheapest, or wants to see how the answer changes if they pay it off early.",
    ui: "rate-compare/after.html",
    inputSchema: {
      type: "object",
      properties: {
        horizonYears: {
          type: "integer", minimum: 1, maximum: 10, default: 5,
          description: "Starting comparison horizon. The user can change it in the app.",
        },
      },
    },
    run({ horizonYears = 5 }) {
      const offers = priceOffers();
      const ranked = rankOffers(horizonYears);
      return {
        content: [
          {
            type: "text",
            text:
              `Comparing ${offers.length} offers over ${horizonYears} years. ` +
              `${ranked[0].lender} is cheapest at ${money(ranked[0].total)}. ` +
              `The user can change the horizon in the app.`,
          },
        ],
        structuredContent: { horizonYears, offers },
      };
    },
  },

  // --- The six archetypes -------------------------------------------------
  {
    name: "search_flights",
    archetype: "picker",
    variant: "before",
    title: "Flight search",
    description: "Open flight search.",
    ui: "picker/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Flight search opened." }],
        structuredContent: { flights: FLIGHTS },
      };
    },
  },
  {
    name: "pick_flight",
    archetype: "picker",
    variant: "after",
    title: "Pick a flight",
    description:
      "Show the shortlisted flights for a route and date already established in the " +
      "conversation so the user can pick one. Use when the user has said where and " +
      "when they are going and now needs to choose. Do not call this before origin, " +
      "destination, and date are known.",
    ui: "picker/after.html",
    inputSchema: {
      type: "object",
      required: ["origin", "destination", "date"],
      properties: {
        origin: { type: "string", description: "Origin airport code." },
        destination: { type: "string", description: "Destination airport code." },
        date: { type: "string", format: "date", description: "Departure date." },
        cabin: { type: "string", enum: ["economy", "business"], default: "economy" },
        passengers: { type: "integer", minimum: 1, default: 1 },
      },
    },
    run({ origin, destination, date, cabin = "economy", passengers = 1 }) {
      /* Two fixture dates exist so the book can photograph the states most
       * widgets never design: one with no results, one that fails. */
      if (date === "2026-12-25") {
        return {
          content: [{
            type: "text",
            text: `No nonstops from ${origin} to ${destination} on ${date}. ` +
                  `One-stops start at $268, and nonstops resume the next day.`,
          }],
          structuredContent: {
            title: `No nonstops, ${date}`,
            summary: `${origin} to ${destination}, ${passengers} passenger, ${cabin}.`,
            flights: [],
          },
        };
      }
      if (date === "2026-01-01") {
        throw new Error(
          `The airline's schedule service did not answer. Nothing was booked. ` +
          `Ask again in a minute, or try a different date.`
        );
      }
      const summary =
        `${origin} to ${destination}, ${passengers} passenger${passengers > 1 ? "s" : ""}, ${cabin}.`;
      return {
        content: [
          {
            type: "text",
            text:
              `Three nonstops on ${date}: ` +
              FLIGHTS.map((f) => `${f.number} ${f.depart} $${f.fare}`).join(", ") + ".",
          },
        ],
        structuredContent: {
          title: `Three nonstops, ${date}`, summary, flights: FLIGHTS,
        },
      };
    },
  },
  {
    name: "hold_flight",
    archetype: "picker",
    variant: "after",
    hidden: true,
    title: "Hold a flight",
    description:
      "Hold a selected flight for twenty minutes without buying it. Use when the " +
      "user has chosen a flight and needs time before paying.",
    inputSchema: {
      type: "object", required: ["number"],
      properties: { number: { type: "string", description: "Flight number to hold." } },
    },
    run({ number }) {
      return {
        content: [
          {
            type: "text",
            text:
              `${number} is held for 20 minutes and nothing has been charged. ` +
              `It releases automatically if the user does not confirm.`,
          },
        ],
        structuredContent: { held: number, expiresInMinutes: 20, undoTool: "release_hold" },
      };
    },
  },
  {
    name: "new_expense",
    archetype: "form",
    variant: "before",
    title: "New expense",
    description: "Open the expense submission form.",
    ui: "form/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Expense form opened." }],
        structuredContent: {},
      };
    },
  },
  {
    name: "confirm_expense",
    archetype: "form",
    variant: "after",
    title: "Confirm an expense",
    description:
      "Show a prefilled expense for the user to confirm. Use when the user has " +
      "supplied a receipt or described a purchase and wants it filed. Pass " +
      "everything already known from the receipt or the conversation; the user " +
      "only fills what is missing.",
    ui: "form/after.html",
    inputSchema: {
      type: "object",
      properties: {
        merchant: { type: "string", description: "Who was paid." },
        amount: { type: "number", exclusiveMinimum: 0, description: "Total charged." },
        currency: { type: "string", default: "USD" },
        date: { type: "string", format: "date", description: "Date of the purchase." },
        category: { type: "string", enum: ["Travel", "Meals", "Software", "Other"] },
      },
    },
    run(args) {
      const draft = { ...EXPENSE_DRAFT, ...args };
      return {
        content: [
          {
            type: "text",
            text:
              `Ready to submit ${draft.currency} ${draft.amount} at ${draft.merchant} ` +
              `on ${draft.date}, category ${draft.category}. Waiting on confirmation.`,
          },
        ],
        structuredContent: { draft },
      };
    },
  },
  {
    name: "submit_expense",
    archetype: "form",
    variant: "after",
    hidden: true,
    title: "Submit an expense",
    description:
      "File a confirmed expense against the employee's cost centre. Use only after " +
      "the user has confirmed the amount and merchant. Reversible with void_expense.",
    inputSchema: {
      type: "object",
      required: ["amount", "merchant", "date"],
      properties: {
        amount: { type: "number", exclusiveMinimum: 0, description: "Total charged." },
        merchant: { type: "string", description: "Who was paid." },
        date: { type: "string", format: "date", description: "Date of the purchase." },
        category: { type: "string", enum: ["Travel", "Meals", "Software", "Other"] },
        currency: { type: "string", default: "USD" },
        justification: {
          type: "string",
          description: "Business purpose. Required when the amount is over 500.",
        },
        employeeId: { type: "string", description: "Filed on behalf of this employee." },
        costCentre: { type: "string", description: "Cost centre to charge." },
      },
    },
    run(args) {
      if (args.amount > 500 && !args.justification) {
        throw new Error("Expenses over $500 require a justification.");
      }
      const id = "EXP-" + String(Math.abs(hash(JSON.stringify(args))) % 100000).padStart(5, "0");
      return {
        content: [
          {
            type: "text",
            text:
              `Expense ${id} filed: ${args.currency || "USD"} ${args.amount} at ` +
              `${args.merchant} on ${args.date}. Reverse it with void_expense.`,
          },
        ],
        structuredContent: { expenseId: id, undoTool: "void_expense" },
      };
    },
  },
  {
    name: "void_expense",
    archetype: "form",
    variant: "after",
    hidden: true,
    title: "Void an expense",
    description:
      "Reverse an expense that was already filed. Use when the user says a filed " +
      "expense was wrong, was the personal card, or should not have been submitted.",
    inputSchema: {
      type: "object", required: ["expenseId"],
      properties: {
        expenseId: { type: "string", description: "Identifier returned by submit_expense." },
      },
    },
    run({ expenseId }) {
      return {
        content: [
          {
            type: "text",
            text: `Expense ${expenseId} is voided and will not be reimbursed. Nothing else changed.`,
          },
        ],
        structuredContent: { expenseId, state: "voided" },
      };
    },
  },
  {
    name: "ops_overview",
    archetype: "dashboard",
    variant: "before",
    title: "Ops overview",
    description: "Open the operations overview dashboard.",
    ui: "dashboard/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Ops overview opened." }],
        structuredContent: { metrics: OPS.metrics },
      };
    },
  },
  {
    name: "service_status",
    archetype: "dashboard",
    variant: "after",
    title: "Service status",
    description:
      "Show whether the platform is healthy right now, with the one or two numbers " +
      "that explain the verdict. Use when the user asks how things are, or whether " +
      "something is down. Safe to call again to check for changes.",
    ui: "dashboard/after.html",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description: "Narrow to one service. Omit for the whole platform.",
        },
      },
    },
    run({ service } = {}) {
      return {
        content: [
          {
            type: "text",
            text:
              `${OPS.state}: ${OPS.headline}. ${OPS.because} ` +
              OPS.headliners.map((h) => `${h.label} ${h.value}`).join(", ") +
              `, as of ${OPS.asOf}.`,
          },
        ],
        structuredContent: service
          ? { ...OPS, services: OPS.services.filter((s) => s.name === service) }
          : OPS,
      };
    },
  },
  {
    name: "open_document",
    archetype: "viewer",
    variant: "before",
    title: "Document viewer",
    description: "Open a document in the viewer.",
    ui: "viewer/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Document opened at page 1 of 84." }],
        structuredContent: { pageText: CONTRACT.pageText, pages: 84 },
      };
    },
  },
  {
    name: "find_clause",
    archetype: "viewer",
    variant: "after",
    title: "Find a clause",
    description:
      "Show the clauses in the contract that govern a topic, quoted, with the " +
      "governing words highlighted. Use when the user asks what the contract says " +
      "about something.",
    ui: "viewer/after.html",
    inputSchema: {
      type: "object", required: ["topic"],
      properties: { topic: { type: "string", description: "What the user asked about." } },
    },
    run({ topic }) {
      const first = CONTRACT.matches[0];
      return {
        content: [
          {
            type: "text",
            text:
              `${CONTRACT.matches.length} clauses govern ${topic}. ` +
              `${first.heading} (page ${first.page}): ${first.plain}`,
          },
        ],
        structuredContent: {
          topic, matches: CONTRACT.matches, documentUrl: CONTRACT.documentUrl,
        },
      };
    },
  },
  {
    name: "deploy_tracker",
    archetype: "tracker",
    variant: "before",
    title: "Deploy tracker",
    description: "Open the deploy tracker.",
    ui: "tracker/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Deploy tracker opened." }],
        structuredContent: DEPLOY,
      };
    },
  },
  {
    name: "deploy_status",
    archetype: "tracker",
    variant: "after",
    title: "Deploy status",
    description:
      "Show the current state of a release rollout, refreshable, with the time it " +
      "was read. Safe to call again when the user asks whether anything changed.",
    ui: "tracker/after.html",
    inputSchema: {
      type: "object",
      properties: { release: { type: "string", description: "Release identifier." } },
    },
    run({ release = DEPLOY.release }) {
      return {
        content: [
          { type: "text", text: `${release} is ${DEPLOY.phase}. ${DEPLOY.summary} As of ${DEPLOY.asOf}.` },
        ],
        structuredContent: { ...DEPLOY, release },
      };
    },
  },
  {
    name: "budget_canvas",
    archetype: "canvas",
    variant: "before",
    title: "Budget canvas",
    description: "Open a freeform budget canvas.",
    ui: "canvas/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Budget canvas opened." }],
        structuredContent: {},
      };
    },
  },
  {
    name: "allocate_budget",
    archetype: "canvas",
    variant: "after",
    title: "Allocate a budget",
    description:
      "Show a direct-manipulation view of how a budget is split, starting from the " +
      "current allocation, so the user can move money between lines. Use when the " +
      "user wants to reallocate rather than to be told the current split. The " +
      "result is readable back as structured data.",
    ui: "canvas/after.html",
    inputSchema: {
      type: "object",
      properties: { cap: { type: "number", description: "Total budget available." } },
    },
    run({ cap = BUDGET.cap }) {
      return {
        content: [
          {
            type: "text",
            text:
              `Allocating ${money(cap)}: ` +
              BUDGET.allocation.map((a) => `${a.name} ${money(a.amount)}`).join(", ") + ".",
          },
        ],
        structuredContent: { cap, allocation: BUDGET.allocation },
      };
    },
  },
  {
    name: "apply_budget",
    archetype: "canvas",
    variant: "after",
    hidden: true,
    title: "Apply a budget allocation",
    description:
      "Save a budget allocation as the committed plan. Use when the user has " +
      "finished moving money and says to apply it. Reversible with allocate_budget.",
    inputSchema: {
      type: "object", required: ["allocation"],
      properties: {
        allocation: {
          type: "array",
          description: "The full split to commit. Every line, not just the changed ones.",
          items: {
            type: "object", required: ["name", "amount"],
            properties: { name: { type: "string" }, amount: { type: "number", minimum: 0 } },
          },
        },
      },
    },
    run({ allocation }) {
      const total = allocation.reduce((a, b) => a + b.amount, 0);
      return {
        content: [
          {
            type: "text",
            text:
              `Allocation saved as the committed plan: ` +
              allocation.map((a) => `${a.name} ${money(a.amount)}`).join(", ") +
              `, ${money(total)} in total.`,
          },
        ],
        structuredContent: { saved: true, total, allocation },
      };
    },
  },
  {
    name: "expense_wizard",
    archetype: "form",
    variant: "before",
    title: "Expense wizard",
    description: "Walk the user through filing an expense in three steps.",
    ui: "flow/wizard.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Expense wizard opened at step 1 of 3." }],
        structuredContent: { draft: { ...EXPENSE_DRAFT } },
      };
    },
  },
  {
    name: "session_check",
    archetype: "trust",
    variant: "before",
    title: "Session check",
    description: "Ask the user to re-authenticate.",
    ui: "trust/before.html",
    inputSchema: { type: "object", properties: {} },
    run() {
      return {
        content: [{ type: "text", text: "Session check displayed." }],
        structuredContent: {},
      };
    },
  },
  {
    name: "reconnect_billing",
    archetype: "trust",
    variant: "after",
    title: "Reconnect Northwind",
    description:
      "Tell the user their Northwind connection expired and offer to send them to " +
      "Northwind's own sign-in page. Use when a Northwind call fails with an " +
      "expired token. Never collects credentials.",
    ui: "trust/after.html",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          default: "northwind.example",
          description: "Which connection expired.",
        },
      },
    },
    run({ provider = "northwind.example" } = {}) {
      return {
        content: [
          {
            type: "text",
            text:
              `The ${provider} connection expired, so the invoice call could not run. ` +
              `Offered to reconnect on ${provider}. No credentials pass through this app.`,
          },
        ],
        structuredContent: { provider, needsReauth: true },
      };
    },
  },
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function byName(name) {
  return APPS.find((a) => a.name === name);
}

export function uiResourceUri(app) {
  return app.ui ? "ui://" + app.ui.replace(/\.html$/, "") : null;
}

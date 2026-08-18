/* Scenes: a transcript plus a render, one per figure in the book.
 *
 * The same list drives the interactive host and the headless camera, so a
 * figure in the book is the same thing you get by clicking the scene in the
 * sidebar. `figure` is the number the book prints; scenes without one are
 * playgrounds.
 */

export const SCENES = [
  {
    id: "rate-prose", figure: "1-1", group: "Chapter 1", variant: "prose",
    title: "Rate comparison, as prose",
    steps: [
      { user: "I've got three quotes for the $30k: Northbank 6.24%, Cedar 4.35% with a $1,400 fee, Harbor 5.6% with $500. Which is actually cheapest over five years?" },
      { call: "compare_rates_text", args: { horizonYears: 5 } },
    ],
  },
  {
    id: "rate-before", figure: "1-2", group: "Chapter 1", variant: "before",
    title: "Rate comparison, kitchen sink",
    steps: [
      { user: "I've got three quotes for the $30k: Northbank 6.24%, Cedar 4.35% with a $1,400 fee, Harbor 5.6% with $500. Which is actually cheapest over five years?" },
      { call: "compare_rates_suite", args: {}, height: 340 },
    ],
    annotations: [
      { sel: "#gear", text: "A settings gear. In a chat. This is the guest asking where you keep the fuse box." },
      { sel: ".tabs", text: "Four tabs. The user asked one question and got a filing cabinet." },
      { sel: ".toolbar", text: "A date range picker for a question that specified the range in the question." },
      { sel: "#rows", text: "The answer is a table you have to compute yourself. Nothing is ranked, nothing is bolded." },
    ],
  },
  {
    id: "rate-after", figure: "1-3", group: "Chapter 1", variant: "after",
    title: "Rate comparison, right-sized",
    steps: [
      { user: "I've got three quotes for the $30k: Northbank 6.24%, Cedar 4.35% with a $1,400 fee, Harbor 5.6% with $500. Which is actually cheapest over five years?" },
      { call: "compare_rates", args: { horizonYears: 5 }, height: 260 },
    ],
    annotations: [
      { good: true, sel: "#best", text: "The verdict is the headline. Half a second is enough to read it." },
      { good: true, sel: "#term", text: "The one control that earns its place: the horizon was an assumption, and re-asking it in prose costs three turns." },
      { good: true, sel: ".origin", text: "Says where the numbers came from, so the user can tell it is not making them up." },
    ],
  },

  {
    id: "canvas-before", figure: "2-1", group: "Chapter 2", variant: "before",
    title: "Budget canvas the model cannot read",
    steps: [
      { user: "Help me split next quarter's $120k." },
      { call: "budget_canvas", args: {}, height: 260 },
    ],
    showContext: true,
    annotations: [
      { sel: "#c", text: "Everything the user does here stays in pixels. The second user is in the room and cannot see any of it." },
    ],
  },
  {
    id: "canvas-after", figure: "2-2", group: "Chapter 2", variant: "after",
    title: "Budget allocator the model can read",
    steps: [
      { user: "Help me split next quarter's $120k." },
      { call: "allocate_budget", args: {}, height: 300 },
    ],
    showContext: true,
    simulate: [{ jsonrpc: "2.0", method: "ui/tool-result", params: { structuredContent: { cap: 120000, allocation: [ { name: "Engineering", amount: 68000 }, { name: "Marketing", amount: 22000 }, { name: "Support", amount: 18000 }, { name: "Travel", amount: 6000 } ] } } }],
    annotations: [
      { good: true, sel: "#bars", text: "Same direct manipulation, but every drag is also a sentence and a JSON object the model can act on." },
    ],
  },

  {
    id: "dash-before", figure: "3-1", group: "Chapter 3", variant: "before",
    title: "Ops overview, twelve tiles",
    steps: [
      { user: "How are things looking?" },
      { call: "ops_overview", args: {}, height: 280 },
    ],
    annotations: [
      { sel: "#tiles", text: "Twelve numbers, no hierarchy. Nothing here answers the question that was asked." },
      { sel: ".spark", text: "Sparklines with no axis, no scale, and no label a glance can use." },
    ],
  },
  {
    id: "dash-after", figure: "3-2", group: "Chapter 3", variant: "after",
    title: "Service status, one verdict",
    steps: [
      { user: "How are things looking?" },
      { call: "service_status", args: {}, height: 220 },
    ],
    annotations: [
      { good: true, sel: "#state", text: "The verdict first, colour-coded, readable at arm's length." },
      { good: true, sel: "#because", text: "One sentence of why. This is the part a glance actually needs." },
      { good: true, sel: "#more", text: "The other nine numbers are one tap away, not gone." },
    ],
  },

  {
    id: "form-before", figure: "4-1", group: "Chapter 4", variant: "before",
    title: "Expense form, nine fields",
    steps: [
      { user: "Here's the receipt: Blue Bottle, $62.40, on the 14th. File it against my usual cost centre." },
      { call: "new_expense", args: {}, height: 470 },
    ],
    annotations: [
      { sel: "label", text: "Employee ID and cost centre. The system already knows both, and the user just said the rest out loud." },
      { sel: "textarea", text: "Nine fields for a $62 coffee. Every one is a consent-gated tool call waiting to happen." },
    ],
  },
  {
    id: "form-after", figure: "4-2", group: "Chapter 4", variant: "after",
    title: "Expense, one confirmation",
    steps: [
      { user: "Here's the receipt: Blue Bottle, $62.40, on the 14th. File it against my usual cost centre." },
      { call: "confirm_expense", args: { merchant: "Blue Bottle Coffee", amount: 62.4, date: "2026-08-14", category: "Meals" }, height: 300 },
    ],
    annotations: [
      { good: true, sel: "#known", text: "Four answers the conversation already contained, shown rather than asked." },
      { good: true, sel: "details", text: "Everything is still correctable. Fewer controls showing, nothing out of reach." },
      { good: true, sel: ".origin", text: "Names its source, so a wrong prefill is obvious instead of silent." },
    ],
  },

  {
    id: "picker-before", figure: "5-1", group: "Chapter 5", variant: "before",
    title: "Flight search, ported from the web",
    steps: [
      { user: "Get me to New York Thursday morning, economy, just me." },
      { call: "search_flights", args: {}, height: 330 },
    ],
    annotations: [
      { sel: ".filters", text: "Six filters re-asking route, date, cabin and passengers, all four of which were in the sentence above." },
      { sel: "table", text: "Ten columns in a 380 pixel viewport. This is a web page wearing a chat costume." },
    ],
  },
  {
    id: "picker-after", figure: "5-2", group: "Chapter 5", variant: "after",
    title: "Three flights, one tap",
    steps: [
      { user: "Get me to New York Thursday morning, economy, just me." },
      { call: "pick_flight", args: { origin: "SFO", destination: "JFK", date: "2026-08-20" }, height: 270 },
    ],
    annotations: [
      { good: true, sel: "#opts", text: "Three options, one tap each. The picker archetype owes the human a decision, not a database." },
      { good: true, sel: "#sub", text: "The filters became a sentence, because the conversation had already set them." },
    ],
  },

  {
    id: "tracker-before", figure: "7-1", group: "Chapter 7", variant: "before",
    title: "Tracker that quietly lies",
    steps: [
      { user: "Ship 2026.8.14 and keep an eye on it." },
      { call: "deploy_tracker", args: {}, height: 220 },
      { assistant: "Rollout is at 10%. I'll watch it." },
      { user: "Did the canary finish?" },
    ],
    annotations: [
      { sel: "#steps", text: "Frozen at render time. The canary finished two minutes ago and this widget will say 'running' until the conversation ends." },
      { sel: "#t", text: "A start time and no read time, which is how a widget states a stale fact with total confidence." },
    ],
  },
  {
    id: "tracker-after", figure: "7-2", group: "Chapter 7", variant: "after",
    title: "Tracker that admits what it knows",
    steps: [
      { user: "Ship 2026.8.14 and keep an eye on it." },
      { call: "deploy_status", args: { release: "api-2026.8.14" }, height: 240 },
    ],
    annotations: [
      { good: true, sel: "#asof", text: "States when it read the world. A tracker with no timestamp is asserting the present tense it cannot back up." },
      { good: true, sel: "#phase", text: "Written back to the model too, so 'did the canary finish' does not need a second render." },
    ],
  },

  {
    id: "viewer-before", figure: "8-1", group: "Chapter 8", variant: "before",
    title: "Document viewer with a toolbar",
    steps: [
      { user: "What does the contract say about getting out of it early?" },
      { call: "open_document", args: {}, height: 340 },
    ],
    annotations: [
      { sel: ".bar", text: "Ten controls rebuilding a browser inside a chat: page nav, zoom, rotate, print, download." },
      { sel: ".page", text: "Page 1 of 84. The user asked about termination, which is on page 41." },
    ],
  },
  {
    id: "viewer-after", figure: "8-2", group: "Chapter 8", variant: "after",
    title: "The clause, quoted",
    steps: [
      { user: "What does the contract say about getting out of it early?" },
      { call: "find_clause", args: { topic: "early termination" }, height: 250 },
    ],
    annotations: [
      { good: true, sel: "#excerpt", text: "The answer, quoted, with the governing words marked. No navigation was required to reach it." },
      { good: true, sel: "#open", text: "One escape hatch, clearly labelled, for the case where the user really does want the whole document." },
    ],
  },

  {
    id: "trust-before", figure: "10-1", group: "Chapter 10", variant: "before",
    title: "A widget shaped like phishing",
    steps: [
      { user: "Pull my Northwind invoices for July." },
      { call: "session_check", args: {}, height: 240 },
    ],
    annotations: [
      { sel: ".fakehost", text: "Dressed as the host. A guest wearing the host's clothes is the definition of the attack, whether or not it means to be." },
      { sel: "input", text: "A password field, in a frame the user cannot inspect, reached by a route they did not choose." },
    ],
  },
  {
    id: "trust-after", figure: "10-2", group: "Chapter 10", variant: "after",
    title: "The trustworthy twin",
    steps: [
      { user: "Pull my Northwind invoices for July." },
      { call: "reconnect_billing", args: {}, height: 210 },
    ],
    annotations: [
      { good: true, sel: ".who", text: "Names itself and its origin before it asks for anything." },
      { good: true, sel: ".promise", text: "Declared network access: none. The CSP is a promise the user can feel." },
    ],
  },
  {
    id: "form-validation", figure: "9-1", group: "Chapter 9", variant: "after",
    title: "Validation the human can act on",
    steps: [
      { user: "And the flight was $842 on the same card." },
      { call: "confirm_expense", args: { merchant: "United Airlines", amount: 842, date: "2026-08-14", category: "Travel" }, height: 320 },
    ],
    simulate: [
      { jsonrpc: "2.0", method: "ui/_click", params: { selector: "#submit" } },
    ],
    annotations: [
      { good: true, sel: "#err", text: "The message names the rule and the threshold, next to the field that fixes it. Not a red border and a shrug." },
      { good: true, sel: "#just", text: "The same rule is declared on the server, so the model is stopped by the constraint that stops the human." },
    ],
  },
  {
    id: "ladder", figure: "12-1", group: "Chapter 12", variant: "after",
    title: "One widget, four rungs",
    call: "deploy_status",
    args: { release: "api-2026.8.14" },
    rungs: [
      {
        label: "Full app",
        note: "Renders, calls tools, complete theme. Refresh works.",
        capabilities: { toolCalls: {}, context: {}, openLink: {} },
        height: 230,
      },
      {
        label: "No callbacks",
        note: "Renders, but the host refuses tool calls. The refresh button is now a lie unless the app checks.",
        capabilities: { context: {} },
        height: 230,
      },
      {
        label: "Static preview",
        note: "First render only, before any result. This is the screen your skeleton has to be.",
        capabilities: { toolCalls: {}, context: {} },
        freeze: true,
        height: 150,
      },
      {
        label: "Content text",
        note: "No app at all. This is what most of the ecosystem gets.",
        textOnly: true,
      },
    ],
  },
  {
    id: "states", figure: "3-3", group: "Chapter 3", variant: "after",
    title: "The four states of one widget",
    call: "pick_flight",
    args: { origin: "SFO", destination: "JFK", date: "2026-08-20" },
    rungs: [
      {
        label: "Skeleton",
        note: "Arguments have arrived, the result has not. Drawn from what is already known.",
        freeze: true,
        height: 190,
      },
      {
        label: "Answer",
        note: "The happy state, and the only one most teams design.",
        height: 250,
      },
      {
        label: "Empty",
        note: "A true answer of none. Not an error, and it names the way forward.",
        args: { origin: "SFO", destination: "JFK", date: "2026-12-25" },
        height: 170,
      },
      {
        label: "Failed",
        note: "Says what broke, that nothing happened, and what to say next.",
        args: { origin: "SFO", destination: "JFK", date: "2026-01-01" },
        height: 170,
      },
    ],
  },
  {
    id: "decompose", figure: "5-3", group: "Chapter 5", variant: "after",
    title: "One over-built widget, decomposed",
    call: "ops_overview",
    args: {},
    rungs: [
      {
        label: "One widget",
        note: "Twelve tiles trying to be a dashboard, a drill-down, and a report at once.",
        call: "ops_overview",
        height: 280,
      },
      {
        label: "Widget one",
        note: "The verdict, which is what the question asked for.",
        call: "service_status",
        height: 220,
      },
      {
        label: "Widget two",
        note: "Called only when somebody asks about a release. A separate question, a separate render.",
        call: "deploy_status",
        args: { release: "api-2026.8.14" },
        height: 240,
      },
      {
        label: "And a sentence",
        note: "The rest of the metrics, answered in text when anybody asks for them.",
        prose: "Cache hit ratio is 88%, queue depth 1.4k, 24 pods with 2 restarts in the last hour, and about $41 an hour. Nothing there is outside its normal range.",
      },
    ],
  },
  {
    id: "form-failures", figure: "9-2", group: "Chapter 9", variant: "before",
    title: "One form, four failures",
    steps: [
      { user: "Here's the receipt: Blue Bottle, $62.40, on the 14th. File it against my usual cost centre." },
      { call: "new_expense", args: {}, height: 470 },
    ],
    showContext: true,
    annotations: [
      { sel: "label", text: "ONE. Seven of these nine fields hold values the model could have passed. The schema is empty, so it passed none." },
      { sel: "select", text: "TWO. Category is a free dropdown here and an enum on the server. The model can send 'Food & Bev' and find out at submit time." },
      { sel: "textarea", text: "THREE. The $500 justification rule exists on the server and appears nowhere on this form until it refuses you." },
      { sel: "button", text: "FOUR. Submits, shows a tick, and writes nothing back. Three turns later, 'did that go through' has no answer." },
    ],
  },
  {
    id: "flow-shapes", figure: "8-3", group: "Chapter 8", variant: "after",
    title: "One flow, three shapes",
    call: "confirm_expense",
    args: { merchant: "Blue Bottle Coffee", amount: 62.4, date: "2026-08-14", category: "Meals" },
    rungs: [
      {
        label: "A wizard",
        note: "One render, three internal steps, a Back button you had to write. The model sees one tool call.",
        call: "expense_wizard",
        args: {},
        height: 300,
      },
      {
        label: "Three renders",
        note: "Step one of three, in the transcript. Each step is a tool with arguments, so the user can go back by asking.",
        call: "pick_flight",
        args: { origin: "SFO", destination: "JFK", date: "2026-08-20" },
        height: 270,
      },
      {
        label: "One card",
        note: "It was never a flow. One decision, four assumptions shown, corrections behind a disclosure.",
        call: "confirm_expense",
        height: 300,
      },
      {
        label: "The test",
        prose: "Can the user do the steps in any order? Yes: one card. No, and each step matters alone: three renders. No, and the steps are meaningless apart: one widget, writing back at every step.",
        note: "Which one you owe the reader.",
      },
    ],
  },
];

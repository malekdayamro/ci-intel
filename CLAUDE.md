# CI Intel — Architecture & Data Documentation

**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Live on Cloudflare Workers  

---

## 1. What CI Intel Is

CI Intel is an internal sales intelligence platform for the Charter Itinerary sales team. It is a single-page web application that aggregates industry intelligence about the global superyacht market — people movements, company news, new builds, events, and sales signals — into one interface.

It is a **read-only reference tool**, updated on a bi-weekly cycle. It is not connected to live data sources. All intelligence is manually researched, verified, and written by the team before each update.

The intended audience is the CI sales team. The purpose is to answer, at any given time: *who is moving, what is changing, and where should we be directing our attention this week.*

---

## 2. Current Architecture

### 2.1 How It Is Built

CI Intel is a **self-contained static HTML file**. All application logic, styling, and data live inside a single `index.html` file. There is no backend, no database, no API calls, and no build step.

```
index.html
├── <style>          — All CSS (design system, layout, components)
├── <body>           — HTML shell (nav, section containers, modals)
└── <script>         — Everything else:
    ├── Data arrays  — PEOPLE, EVENTS, COMPANIES, VESSELS, TRIGGERS, NEWBUILDS
    ├── State        — Filter state, pagination state, outreach log
    ├── Render fns   — renderP(), renderE(), renderC(), renderV(), etc.
    ├── Modal fns    — openP(), openC(), openE(), openV(), openNB()
    └── Init         — show(), tick(), buildTicker(), buildPipeline(), buildHmap()
```

### 2.2 How It Is Hosted

The app is deployed as a **Cloudflare Worker** with a static assets binding. The Worker serves files from the `public/` directory via `env.ASSETS`. All unmatched routes fall back to `index.html` to support SPA-style navigation.

```
Browser → Cloudflare Worker (src/index.js) → env.ASSETS → public/index.html
```

### 2.3 Current Update Process (Manual)

1. Open the current `index.html` in a text editor or via Claude
2. Edit the relevant data arrays in the `<script>` block
3. Upload the updated file to the Cloudflare Worker (via the Cloudflare dashboard or `wrangler deploy`)
4. The new version is live immediately on next page load

Update cadence: **bi-weekly** (every two weeks).  
Sections updated each cycle: Triggers, Events, New Builds, People (as needed), Companies (as needed).  
Estimated effort: **2–3 hours per cycle**.

---

## 3. Data Structure

### 3.1 Data Sections

CI Intel contains six primary data arrays, all defined as JavaScript `const` arrays inside `<script>`:

| Array | Records | Description |
|-------|---------|-------------|
| `PEOPLE` | 26 | Industry contacts — owners, CEOs, captains, brokers, designers |
| `EVENTS` | 24 | Industry events — shows, regattas, conferences, forums |
| `COMPANIES` | 20 | Companies — management, charter, shipyards, associations, media |
| `VESSELS` | 27 | Named superyachts — with management company and signal context |
| `TRIGGERS` | 18 | Sales signals — specific actionable intelligence items |
| `NEWBUILDS` | 12 | Confirmed new builds — yard, size, delivery date, % complete |

### 3.2 People Record Schema

```javascript
{
  n:    "Full Name",                    // Display name
  r:    "Job Title",                    // Current role
  v:    "Company Name",                 // Company or vessel
  sz:   "Fleet size or context",        // Scale/context descriptor
  reg:  "Monaco / London",              // Region(s)
  ag:   "Management",                   // Category: Management | Charter | Shipyard | Industry | Crew
  rc:   "be",                           // Badge colour: be=gold, sh=red, sn=green, sw=amber, bch=teal
  sig:  "hot",                          // Signal level: hot | warm | new
  sl:   "CEO · Active",                 // Short signal label (shown in table row)
  mv:   "JAN 2026",                     // Date of last notable move/appointment
  li:   "https://linkedin.com/...",     // LinkedIn search URL
  note: "Full intelligence paragraph"   // Detailed intel — who they are, what changed, why it matters
}
```

### 3.3 Event Record Schema

```javascript
{
  n:    "Event Name",
  d:    "25",                           // Day of month as string, or "TBC"
  mo:   "MAR",                          // Month: JAN | FEB | MAR | APR | MAY | JUN | JUL | AUG | SEP | OCT | NOV | DEC
  yr:   "2026",                         // Year as string
  loc:  "Palm Beach, Florida",          // Location
  tags: ["show", "networking"],         // Filter tags: show | charter | racing | social | networking | conference | superyacht
  att:  "100K+ visitors",               // Attendance descriptor
  note: "Full event intelligence"       // Why this event matters, who attends, CI relevance
}
```

**Note on TBC dates:** Events with `d:"TBC"` are treated as day 28 of their stated month for sorting purposes. They appear in correct calendar order among upcoming events.

### 3.4 Company Record Schema

```javascript
{
  n:      "Company Name",
  hq:     "Monaco",                     // Headquarters location
  ct:     "mgmt",                       // Type: mgmt | charter | shipyard | crew | media | assoc
  fl:     "220+",                       // Fleet size or scale indicator
  growth: "up",                         // Trend: up | stable | down
  upd:    "Q1 2026",                    // Date of last notable update
  news:   "Short recent intel snippet", // One-line latest news (shown in table)
  angle:  "Detailed company intel",     // Full intelligence paragraph
  why:    "Why contact now",            // Specific reason to act — what just changed
  angle2: "Sales approach context"      // Additional context (optional)
}
```

### 3.5 Trigger Record Schema

```javascript
{
  n:    "Signal Title",
  typ:  "hot",                          // hot | warm | signal
  cat:  "Delivery",                     // Category label
  sub:  "One-line summary",
  note: "Full signal detail and recommended action"
}
```

### 3.6 New Build Record Schema

```javascript
{
  n:    "Project Name or Hull",
  yard: "Lürssen",                      // Shipyard
  fl:   "🇩🇪",                          // Flag emoji (country of yard)
  loa:  "117m",                         // Length overall
  del:  "Q2 2026",                      // Expected delivery
  pct:  85,                             // Percentage complete (integer 0–100)
  mgmt: "TBC",                          // Management company (or "TBC")
  note: "Build intelligence and context"
}
```

### 3.7 Vessel Record Schema

```javascript
{
  n:    "Vessel Name",
  loa:  "111m",                         // Length overall
  yr:   "2020",                         // Build year
  yard: "Oceanco",                      // Shipyard
  own:  "Gabe Newell",                  // Current owner
  mgmt: "TBC",                          // Management company
  reg:  "Cayman Islands",               // Flag / registration
  stx:  "Management signal text",       // Why this vessel matters right now
  note: "Full vessel intelligence"
}
```

---

## 4. Application Logic

### 4.1 Rendering Pipeline

Each section has a dedicated render function that:
1. Pulls data through a filter/sort function (`getP()`, `getE()`, `getC()` etc.)
2. Paginates via `paginate(data, page, pageSize)`
3. Generates HTML strings and injects into the section's container div
4. Renders pagination controls via `renderPag()`

```
show('people')
  → renderP()
    → getP()           // applies search query + filter state
    → paginate()       // slices to current page
    → .map(p => ...)   // generates row HTML
    → innerHTML inject
    → renderPag()      // prev/next/page buttons
```

### 4.2 Event Sorting

Events are sorted at render time by `getE()`:

- **Upcoming events** (date ≥ today): sorted ascending by date (soonest first)
- **Past events** (date < today): sorted descending by date (most recent first), appended after upcoming
- **TBC dates**: treated as day 28 of the stated month for sort purposes

Today's date is hardcoded in `getE()` as `new Date(2026, 2, 13)` and **must be updated** each bi-weekly cycle.

### 4.3 Pagination Settings

```javascript
const PP = {
  p:   20,   // People per page
  v:   9,    // Vessels per page
  c:   20,   // Companies per page
  e:   24,   // Events per page (set to total count so all show on one page)
  com: 9,    // Communities per page
  t:   12,   // Triggers per page
}
```

### 4.4 Prospect Scoring

Each person record is scored dynamically by `score(p)` based on:
- Signal level (`sig`: hot/warm/new)
- Role seniority (CEO, Owner, Director etc. parsed from `r` field)
- Presence of outreach log entry

Score is displayed as a coloured badge on the people table row.

### 4.5 Outreach Log

The outreach log (`OL{}`) is session-persistent only — it lives in memory and resets on page reload. It allows the sales team to mark people as `contacted`, `won`, or `dead` during a session. This is not persisted to any database.

**This is a known limitation.** See Section 6 for the path to persistence.

---

## 5. Design System

All styling uses CSS custom properties defined at `:root`:

```css
--navy-deepest: #070d1a    /* Page background */
--navy-deep:    #0b1528    /* Card/section background */
--navy-mid:     #0f1e35    /* Elevated surface */
--navy-border:  #1e3358    /* All borders */
--gold:         #f5b240    /* Primary accent, CTAs */
--teal:         #00b4d8    /* Secondary accent */
--green:        #22c55e    /* Positive / up signals */
--red:          #f43f5e    /* Hot signals / urgent */
--serif:        'DM Sans'  /* Body text */
--mono:         'JetBrains Mono'  /* Labels, counters, tags */
```

Badge classes: `sh` (red/hot), `sn` (green/new), `sw` (amber/warm), `be` (gold), `bc` (teal), `bch` (charter/orange).

---

## 6. Future Architecture — Recommended Path

The current static file approach works well for a small team updating bi-weekly. As the team scales or update frequency increases, the following architecture is recommended.

### 6.1 Phase 1 — Cloudflare KV (Immediate Improvement)

Split the data layer from the HTML shell. Store each data array as JSON in Cloudflare KV. The Worker injects the KV data into the HTML on each request.

```
Browser → Worker → fetches KV data → injects into HTML template → returns page
```

**Benefits:**
- Update data without touching the HTML/CSS/JS
- Different team members can update different sections independently
- Data can be updated via the Cloudflare dashboard (no code deployment)

**KV namespace structure:**
```
ci-intel-data
├── people      → JSON array of person records
├── events      → JSON array of event records
├── companies   → JSON array of company records
├── vessels     → JSON array of vessel records
├── triggers    → JSON array of trigger records
└── newbuilds   → JSON array of new build records
```

**Worker pattern:**
```javascript
export default {
  async fetch(request, env) {
    const people    = await env.CI_INTEL.get('people');
    const events    = await env.CI_INTEL.get('events');
    const companies = await env.CI_INTEL.get('companies');
    // ... etc

    const html = HTML_TEMPLATE
      .replace('__PEOPLE__',    people)
      .replace('__EVENTS__',    events)
      .replace('__COMPANIES__', companies);
      // ... etc

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
```

### 6.2 Phase 2 — Google Sheets as Data Source

Each data section becomes a tab in a shared Google Sheet. The team edits the sheet. A scheduled Cloudflare Worker cron job fetches the sheet, transforms rows into the correct JSON schema, and writes to KV.

```
Google Sheet (team edits)
    ↓  (cron: daily at 06:00 UTC)
Cloudflare Worker (cron trigger)
    ↓  fetches via Google Sheets API
    ↓  transforms rows → JSON arrays
    ↓  writes to KV
Cloudflare KV (data store)
    ↓  (on every page request)
Cloudflare Worker (fetch handler)
    ↓  reads KV → injects into HTML
Browser (sales team)
```

**Google Sheet structure:**

Each tab maps directly to a data array. Column headers match the record field names exactly:

| Tab | Columns |
|-----|---------|
| People | n, r, v, sz, reg, ag, rc, sig, sl, mv, li, note |
| Events | n, d, mo, yr, loc, tags, att, note |
| Companies | n, hq, ct, fl, growth, upd, news, angle, why |
| Vessels | n, loa, yr, yard, own, mgmt, reg, stx, note |
| Triggers | n, typ, cat, sub, note |
| New Builds | n, yard, fl, loa, del, pct, mgmt, note |

**Transform pattern (Sheets row → JSON record):**
```javascript
function transformPeople(rows) {
  const [headers, ...data] = rows;
  return data.map(row => {
    const record = {};
    headers.forEach((h, i) => { record[h] = row[i] || ''; });
    // Handle comma-separated tags array
    if (record.tags) record.tags = record.tags.split(',').map(t => t.trim());
    return record;
  });
}
```

**Cron trigger configuration (`wrangler.toml`):**
```toml
[triggers]
crons = ["0 6 * * *"]   # Daily at 06:00 UTC
```

**Cron handler:**
```javascript
export default {
  async scheduled(event, env, ctx) {
    const sheetId  = env.GOOGLE_SHEET_ID;
    const apiKey   = env.GOOGLE_API_KEY;

    const sections = ['People', 'Events', 'Companies', 'Vessels', 'Triggers', 'NewBuilds'];
    for (const section of sections) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${section}?key=${apiKey}`;
      const res  = await fetch(url);
      const json = await res.json();
      const data = transform(section, json.values);
      await env.CI_INTEL.put(section.toLowerCase(), JSON.stringify(data));
    }
  }
}
```

**Required Cloudflare secrets (`wrangler secret put`):**
```
GOOGLE_SHEET_ID    — The ID from the Google Sheet URL
GOOGLE_API_KEY     — Google Cloud API key with Sheets API enabled
```

### 6.3 Phase 3 — Persistent Outreach Log (Optional)

Replace the in-memory outreach log with Cloudflare KV persistence. Each log entry is stored as `outreach:{personKey}` → `{status, timestamp, note}`.

This allows the sales team to see who has been contacted across sessions and devices.

### 6.4 Phase 4 — Notifications (Optional)

Add a scheduled job that monitors the triggers array for `sig:"hot"` items newer than 7 days and sends a Slack webhook or email digest to the sales team each Monday morning.

---

## 7. Data Sources

All intelligence in CI Intel is manually researched. Primary sources used each update cycle:

| Source | Used For |
|--------|----------|
| [Boat International / BOATPro](https://boatinternational.com) | New builds, deliveries, ownership, fleet data |
| [Superyachts.com](https://superyachts.com) | People movements, company news |
| [Dockwalk](https://dockwalk.com) | Captain appointments, crew industry news |
| [MYBA](https://myba.com) | Charter event dates, broker news |
| [Lloyd's Register](https://lr.org) | Fleet size statistics |
| Company LinkedIn pages | Leadership appointments, office openings |
| Show websites | Event dates, attendance figures |
| Public SEC filings | MarineMax/public company data |

**Update checklist (bi-weekly):**
- [ ] Check BOATPro for new build updates and delivery changes
- [ ] Review Superyachts.com news for people movements and company news
- [ ] Update `today` date in `getE()` sort function
- [ ] Review EVENTS for any date confirmations (TBC → actual dates)
- [ ] Review TRIGGERS — archive resolved, add new
- [ ] Update `This Week` priority widget with current actionable items
- [ ] Update `Updated Mar 2026` timestamp in nav
- [ ] Update footer: `Last updated` and `Next update` dates

---

## 8. File Reference

```
repository/
├── public/
│   ├── index.html                ← The entire application (~152KB)
│   └── robots.txt                ← Search engine block (noindex)
├── src/
│   └── index.js                  ← Cloudflare Worker entry point (ASSETS binding + SPA fallback)
├── wrangler.toml                 ← Cloudflare Worker config
├── package.json                  ← Dev dependency: wrangler
├── .gitignore                    ← Excludes node_modules/, .wrangler/
├── CLAUDE.md                     ← This document
└── (future)
    ├── template.html             ← HTML shell (data placeholders only)
    └── data/
        ├── people.json
        ├── events.json
        ├── companies.json
        ├── vessels.json
        ├── triggers.json
        └── newbuilds.json
```

---

## 9. Deployment

### Current (Wrangler CLI)

```bash
# Install dependencies (first time only)
npm install

# Authenticate with Cloudflare (first time only)
npx wrangler login

# Local dev server
npm run dev

# Deploy to production
npm run deploy

# Set secrets (Phase 2 onward)
wrangler secret put GOOGLE_SHEET_ID
wrangler secret put GOOGLE_API_KEY

# Create KV namespace
wrangler kv:namespace create CI_INTEL
# Add the returned namespace ID to wrangler.toml

# Tail live logs
wrangler tail
```

### `wrangler.toml` (Phase 2 template)

```toml
name = "ci-intel"
main = "src/index.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./public"
binding   = "ASSETS"

[[kv_namespaces]]
binding = "CI_INTEL"
id      = "YOUR_KV_NAMESPACE_ID"

[triggers]
crons = ["0 6 * * *"]
```

---

*Document maintained by the Charter Itinerary team. Update alongside each bi-weekly data refresh.*
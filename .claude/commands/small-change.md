# /small-change — CI Intel Minor Change Scaffold

You are making a small, focused change to the CI Intel codebase. Follow this workflow precisely.

---

## Step 1 — Ask what the change is

If the user has not already described the change, ask:

> "What would you like to change? (e.g. update a data record, tweak a label, adjust a style, fix a render bug)"

Wait for the user's answer before proceeding.

---

## Step 2 — Investigate

Read `public/index.html`. Locate the exact code affected by the requested change. Identify:

- The **section** it belongs to (PEOPLE / EVENTS / COMPANIES / VESSELS / TRIGGERS / NEWBUILDS / CSS / render function / init / other)
- The **line number(s)** involved
- Any **downstream effects** (e.g. does changing a field name break a render function?)

Also read `CLAUDE.md` and confirm the change is consistent with:
- The correct data schema for that section (Section 3)
- The design system tokens (Section 5)
- The naming conventions below

If anything is ambiguous or risky, flag it before continuing.

---

## Step 3 — Confirm with the user

Present a clear, concise summary:

```
Section:   [section name]
File:      public/index.html  line [X]
Change:    [one sentence description of what will change]
Risk:      [None / Low / Medium — and why]
```

Ask: **"Confirm? (yes / no / adjust)"**

Do not make any edits until the user confirms.

---

## Step 4 — Implement

Make only the change described. Do not refactor surrounding code, fix unrelated issues, or add comments unless they were already there.

---

## Step 5 — Confirm what was done

After the edit, output a brief summary:

```
Done.
File:    public/index.html  line [X]
Changed: [exact description]
```

If `public/index.html` was changed, remind the user:
> "Run `npm run deploy` to push the update live."

---

## CI Intel Best Practices

Apply these at all times. Flag any existing violations if spotted during investigation, but do not fix them unless they are directly related to the requested change.

### Data Records

- Field names must match the schema in `CLAUDE.md` exactly — single-letter keys (`n`, `r`, `v`, `sig`, etc.)
- String values use `"double quotes"`
- Arrays (e.g. `tags`) use `["item1", "item2"]` format
- Percentages (`pct`) are integers, not strings: `85` not `"85%"`
- Dates use the format `"Q2 2026"` for quarters or `"JAN 2026"` for month-year
- Signal levels: only `"hot"`, `"warm"`, or `"new"` — no other values
- Badge colours (`rc`): only `"be"`, `"sh"`, `"sn"`, `"sw"`, `"bch"` — no inline styles
- LinkedIn URLs go in the `li` field only — never embedded elsewhere
- `note` fields are full prose sentences, not bullet points

### CSS / Design System

- Never introduce hardcoded hex colours — always use a CSS custom property (e.g. `var(--gold)`, `var(--red)`)
- Never add inline `style=""` attributes to data records or render output
- Font sizes use `rem` units only — no `px` for type
- Spacing uses existing CSS classes — do not add one-off margin/padding inline
- New badge variants must use an existing badge class (`sh`, `sn`, `sw`, `be`, `bch`) — do not invent new ones

### JavaScript

- Render functions follow the existing naming pattern: `renderP()`, `renderE()`, `renderC()`, `renderV()`, `renderT()`, `renderNB()`
- Filter/get functions: `getP()`, `getE()`, `getC()`, `getV()`, `getT()`, `getNB()`
- Modal functions: `openP()`, `openE()`, `openC()`, `openV()`, `openNB()`
- State objects follow the pattern: `pS`, `vS`, `cS`, `eS`, `comS`, `tS`, `nbS`
- Do not use `var` — use `const` or `let`
- Do not add `console.log` statements
- Event listeners use inline `onclick=` handlers consistent with the existing pattern — do not introduce `addEventListener` unless necessary

### Content & Copy

- Company and people names must match their real-world spelling exactly (check against existing records)
- All intelligence copy is written in third-person, present or past tense — no "you" or "we"
- Dates in `note` fields reference the year explicitly (e.g. "appointed January 2026" not "appointed last month")
- The `today` date in `getE()` must be updated to the current date on every bi-weekly refresh cycle

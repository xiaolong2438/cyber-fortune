# Naming, Dictionary, and Ziwei Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support arbitrary loaded AI models, use complete Kangxi stroke data for name analysis, generate varied names with traceable classical sources, and make Ziwei calculations reliable offline and online.

**Architecture:** Keep the existing vanilla HTML/CSS/JavaScript boundaries. Add a dedicated naming-data module and a generated Kangxi stroke lookup, then let `NameCalculator` derive five-element and stroke indexes from that data. Keep `ZiweiCalculator` as the adapter around iztro, but vendor the browser build and validate all inputs before calling the documented `iztro.astro.bySolar` API.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js assertion tests, iztro 2.5.3, MIT-licensed Kangxi stroke data.

---

### Task 1: Lock the requested behavior with failing tests

**Files:**
- Create: `test/naming-data-tests.js`
- Create: `test/ziwei-calculator-tests.js`
- Modify: `test/api-config-ui-tests.js`

- [ ] Assert the model control is a free text input backed by an initially empty datalist and contains no hard-coded recommended model.
- [ ] Assert generated suggestions include source work, quote, character elements, and Kangxi strokes.
- [ ] Assert two consecutive generated batches are not identical while custom characters remain honored.
- [ ] Assert unknown characters are marked unclassified rather than assigning five elements from `strokes % 5`.
- [ ] Assert Ziwei calls `astro.bySolar` with a validated date, time index, and Chinese gender string, then returns 12 parsed palaces.
- [ ] Assert invalid dates and unavailable libraries return an explicit structured fallback without throwing.

### Task 2: Add complete Kangxi strokes and curated naming metadata

**Files:**
- Create: `scripts/build-kangxi-strokes.js`
- Create: `js/data/kangxi-strokes.js` (generated)
- Create: `js/data/name-character-data.js`
- Create: `THIRD_PARTY_NOTICES.md`
- Modify: `index.html`

- [ ] Generate a browser lookup for all 63,696 Unicode Kangxi characters from `breezyreeds/kangxi-strokecount`.
- [ ] Record source URL, MIT license, generation timestamp, and record count in the generated file and notices.
- [ ] Add a naming-focused catalog spanning all five elements, indexed by character and Kangxi strokes.
- [ ] Add verified public-domain classical name phrases with work, chapter/title, author when known, quote, and meaning.
- [ ] Load the data modules before `name-calculator.js`.

### Task 3: Replace fixed name combinations with a varied sourced generator

**Files:**
- Modify: `js/name-calculator.js`
- Modify: `js/main.js`
- Modify: `css/style.css`

- [ ] Derive `charWuXing`, stroke indexes, and source lookup from the data modules.
- [ ] Prefer classical two-character phrases matching needed elements, then fill from a seeded shuffled catalog.
- [ ] Rotate the seed per generation so repeated clicks produce different batches without using unstable score calculations.
- [ ] Preserve first/second/candidate character constraints and annotate custom results separately.
- [ ] Display source, original quote, individual Kangxi strokes, and five elements in result cards and reports.
- [ ] Return `null` for genuinely unclassified character elements and show that state in name analysis.

### Task 4: Make the API model flow unrestricted

**Files:**
- Modify: `index.html`
- Modify: `js/config/ai-config.js`
- Modify: `js/config/config-manager.js`
- Modify: `js/main.js`
- Modify: `css/style.css`

- [ ] Replace the hard-coded model select with a free text model input and empty datalist.
- [ ] Populate only models returned by the configured endpoint; do not inject recommendations on load failure.
- [ ] Preserve a previously saved arbitrary model and allow manual input when an endpoint does not expose `/models`.
- [ ] Remove DeepSeek-specific recommendation copy from the naming UI and configuration prompts.

### Task 5: Repair and harden Ziwei calculations

**Files:**
- Create: `js/vendor/iztro.min.js`
- Create: `js/vendor/iztro.LICENSE`
- Modify: `index.html`
- Modify: `js/ziwei-calculator.js`

- [ ] Vendor the installed iztro 2.5.3 browser bundle so calculations do not depend on a CDN.
- [ ] Normalize and validate year, month, day, hour, minute, and gender before calculation.
- [ ] Use `iztro.astro.bySolar(date, timeIndex, gender, true, 'zh-CN')`.
- [ ] Handle early and late Zi hour explicitly, validate the returned palace shape, and retain useful failure diagnostics.
- [ ] Replace the misleading empty-palace fallback with a structured unavailable result and user-facing reason.

### Task 6: Full verification and rendered QA

**Files:**
- Test: `test/*.js`
- Verify: `index.html`, `css/style.css`, `js/**/*.js`

- [ ] Run all Node test suites, syntax checks, and `git diff --check`.
- [ ] Test API configuration: provider selection -> fake key -> model loading -> arbitrary model save.
- [ ] Test naming twice with the same birth data and confirm different sourced suggestions.
- [ ] Test name analysis with catalog and non-catalog characters.
- [ ] Test Ziwei with normal time, 23:xx late Zi time, invalid date, and missing-library fallback.
- [ ] Check desktop and 390x844 mobile layouts, console health, clipping, and horizontal overflow.

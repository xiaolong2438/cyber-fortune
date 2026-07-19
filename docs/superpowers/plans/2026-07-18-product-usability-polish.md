# Product Usability Polish Implementation Plan

> **For agentic workers:** Execute this plan inline task-by-task. Keep the existing calculation, naming-data, API-routing, and Cloudflare security behavior unchanged.

**Goal:** Improve functional completeness, repeated-use efficiency, accessibility, and mobile readability without replacing the established cyberpunk visual language.

**Architecture:** Add a small browser-only `FormAssistant` module for whitelisted recent birth-profile storage, form filling, and inline validation. Keep result orchestration in `CyberFortune`, adding focused naming-result render/filter/favorite helpers and an accessible mobile navigation state. Store only non-secret profile values and favorite full names in dedicated localStorage keys.

**Tech Stack:** HTML5, CSS3, vanilla browser JavaScript, Node.js contract/unit tests, in-app browser QA.

---

### Task 1: Lock the usability contract with failing tests

**Files:**
- Create: `test/usability-ui-tests.js`
- Modify: `package.json`

- [ ] Assert that every workflow exposes a recent-profile action and inline feedback region.
- [ ] Unit-test the profile whitelist and prove API keys/names are not persisted.
- [ ] Assert naming results expose element filtering, sorting, favorite/shortlist, and regeneration controls.
- [ ] Assert the mobile navigation toggle has an accessible controlled state.
- [ ] Assert the duplicated `04时` option is removed from the naming-analysis form.
- [ ] Run the new test and confirm RED before production changes.

### Task 2: Add recent-profile reuse and inline form guidance

**Files:**
- Create: `js/ui/form-assistant.js`
- Modify: `index.html`
- Modify: `js/main.js`

- [ ] Implement a strict birth-profile whitelist: gender, year, month, day, hour, minute, province, city.
- [ ] Persist only after a valid workflow submission; never store a name, API URL, model, or API key.
- [ ] Add one-click fill actions for all four workflows, including explicit male/female targets in the marriage form.
- [ ] Add form-level live feedback, field invalid states, and focus the first invalid control.
- [ ] Programmatically connect previously unassociated labels to controls and clear errors as users correct values.

### Task 3: Make naming recommendations explorable

**Files:**
- Modify: `js/main.js`
- Modify: `css/style.css`

- [ ] Add element filtering, default/score sorting, visible-result count, and a reset state.
- [ ] Add favorite buttons on each name card and a compact persistent shortlist.
- [ ] Persist favorites as a de-duplicated array of full-name strings only.
- [ ] Add a “generate another batch” action that safely re-submits the current naming form.
- [ ] Improve card hierarchy so name, score, source, quote, and character metadata scan clearly on desktop and mobile.

### Task 4: Compact and harden mobile navigation

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `css/style.css`

- [ ] Add a menu button with `aria-expanded` and `aria-controls`.
- [ ] Close the menu after navigation, Escape, or returning to desktop width.
- [ ] Keep AI configuration directly reachable while reducing the fixed header height on narrow screens.
- [ ] Preserve keyboard focus visibility and prevent horizontal overflow.

### Task 5: Verification and browser QA

**Files:**
- Modify: `index.html` asset versions

- [ ] Run `npm test` and JavaScript syntax checks.
- [ ] Run `git diff --check`.
- [ ] Verify desktop and 390×844 mobile flows in the in-app browser.
- [ ] Exercise recent-profile fill, invalid-form focus, filter/sort/favorite/regenerate, and navigation toggle.
- [ ] Confirm no new console errors and no secrets are read or exposed during QA.

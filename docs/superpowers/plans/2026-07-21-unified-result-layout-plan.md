# Unified Result Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Zhiming, Qiming, Ceming, and Hehun use the same visible-result workspace width and report shell on desktop and mobile.

**Architecture:** Extend the existing Zhiming `:has(.show)` workspace rule into a shared selector for all four feature sections, then apply the same shared shell sizing to all four result panels. Preserve each feature's internal components and existing narrow-screen overrides.

**Tech Stack:** HTML, CSS, Node.js assertion tests, local browser responsive inspection

---

### Task 1: Protect the shared workspace contract

**Files:**
- Modify: `test/usability-ui-tests.js`

- [x] **Step 1: Add a failing desktop width assertion**

Add `testUnifiedResultLayoutContract()` and assert that one rule contains all four section selectors, `max-width: 1440px`, and `grid-template-columns: minmax(300px, 360px) minmax(0, 1fr)`.

- [x] **Step 2: Add a failing mobile width assertion**

Assert that the `768px` media query contains the same four section selectors, `max-width: 1040px`, and `grid-template-columns: 1fr`.

- [x] **Step 3: Run the test and verify RED**

Run `node test/usability-ui-tests.js`. Expect failure because only `#zhiming` is present in the current visible-result workspace selector.

### Task 2: Unify result workspace and shell sizing

**Files:**
- Modify: `css/style.css`

- [x] **Step 1: Share the desktop visible-result workspace rule**

Replace the Zhiming-only selector with selectors for `#zhiming`, `#qiming`, `#ceming`, and `#hehun`, each matching its shown result panel. Keep `max-width: 1440px` and the Zhiming desktop columns.

- [x] **Step 2: Share the mobile single-column rule**

Replace the Zhiming-only selector in the `768px` media query with the same four visible-result selectors. Keep `max-width: 1040px` and `grid-template-columns: 1fr`.

- [x] **Step 3: Apply the same result-column sizing guards**

Make all four result panels `width: 100%` and `min-width: 0`, and make their result content and direct children shrink safely without changing feature-specific component grids. Retain the existing compact `560px` padding rules.

- [x] **Step 4: Run focused tests and verify GREEN**

Run `node test/usability-ui-tests.js`, `node test/ceming-ai-scoring-tests.js`, and `node test/marriage-ai-scoring-tests.js`. Expect all three commands to pass.

### Task 3: Inspect representative responsive widths

**Files:**
- Verify: `css/style.css`
- Verify: `index.html`

- [x] **Step 1: Inspect desktop width**

At a `1440px` or wider viewport, show each result panel in the local page and verify the four result panels compute to the same width without body overflow.

- [x] **Step 2: Inspect mobile width**

At a `375px` viewport, show each result panel and verify the four result panels compute to the same available width without body overflow.

### Task 4: Complete, commit, and push

**Files:**
- Verify: all modified source, test, spec, and plan files

- [x] **Step 1: Run the complete suite**

Run `npm test`. Expect exit code `0` and no failing test.

- [x] **Step 2: Check patch hygiene**

Run `git diff --check` and inspect `git status --short`. Do not stage `*.bak` files.

- [ ] **Step 3: Commit implementation**

Stage `css/style.css`, `test/usability-ui-tests.js`, this plan, and the approved design spec if needed. Commit with `fix: unify result page layout`.

- [ ] **Step 4: Push main**

Run `git push origin main` and verify `origin/main` points to the new commit.

# Mobile Content Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give mobile pages and nested result content more usable horizontal space while preserving desktop behavior.

**Architecture:** Add narrowly scoped overrides to the existing 768px and 560px media queries. Protect the layout with source-contract tests in the existing usability test suite.

**Tech Stack:** HTML, CSS, Node.js assertion tests

---

### Task 1: Add the mobile width regression contract

**Files:**
- Modify: `test/usability-ui-tests.js`

- [x] **Step 1: Write a failing test**

Add assertions for compact section gutters, full-width content containers, and compact nested result/AI padding.

- [x] **Step 2: Verify the test fails**

Run `node test/usability-ui-tests.js` and expect the mobile section gutter assertion to fail against the old CSS.

### Task 2: Apply the mobile width overrides

**Files:**
- Modify: `css/style.css`

- [x] **Step 1: Update the 768px layout**

Set `.section` horizontal padding to `0.5rem` and `.content-container` width to `100%`.

- [x] **Step 2: Update the 560px nested layout**

Set result cards, AI result sections, and AI output blocks to `0.75rem` padding.

- [x] **Step 3: Verify focused tests**

Run `node test/usability-ui-tests.js` and `node test/ceming-ai-scoring-tests.js`; expect both to pass.

### Task 3: Verify the complete change

**Files:**
- Verify: `css/style.css`
- Verify: `test/usability-ui-tests.js`

- [x] **Step 1: Run the full suite**

Run `npm test`; expect all tests to pass.

- [x] **Step 2: Check patch hygiene**

Run `git diff --check` and inspect `git status --short`. Preserve backup files and do not stage or commit them.

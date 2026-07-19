# React Iztro Chart Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or execute this plan inline task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the full interactive `react-iztro` astrolabe to the existing Cyber Fortune birth-analysis result while retaining the verified local `iztro` calculation and structured fallback.

**Architecture:** Treat React as an isolated visualization island instead of migrating the vanilla application. A small JSX entry owns one React root and exposes `window.ZiweiChart.mount/unmount`; `CyberFortune` passes normalized birth data after its existing calculation succeeds. Bundle React, ReactDOM, `react-iztro`, and component CSS into immutable local assets with esbuild so Cloudflare Pages remains a static deployment and no runtime CDN is required.

**Tech Stack:** Vanilla HTML/CSS/JavaScript host, React 18, react-iztro 1.4.2, iztro 2.5.3, esbuild, Node assertion tests.

---

### Task 1: Lock the integration contract

**Files:**
- Create: `test/react-iztro-integration-tests.js`
- Modify: `package.json`

- [ ] Assert dependencies, build script, local bundle tags, React-island entry API, result mount point, graceful fallback, and responsive wrapper exist.
- [ ] Run `node test/react-iztro-integration-tests.js` and confirm RED because the integration entry and assets do not exist.

### Task 2: Add a locally bundled React visualization island

**Files:**
- Create: `js/ui/ziwei-chart-entry.jsx`
- Generate: `js/vendor/react-iztro-chart.js`
- Generate: `js/vendor/react-iztro-chart.css`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Install exact compatible runtime dependencies: React 18, ReactDOM 18, and react-iztro 1.4.2.
- [ ] Add esbuild and a deterministic `build:ziwei-chart` script.
- [ ] Implement hour-to-iztro-index conversion including late Zi hour (`23:00 -> 12`).
- [ ] Implement one-root-per-element lifecycle, prop normalization, an error boundary, and an accessible fallback.
- [ ] Build local minified assets and run the contract test to GREEN.

### Task 3: Mount the full chart in the existing result flow

**Files:**
- Modify: `js/main.js`
- Modify: `index.html`
- Modify: `css/style.css`

- [ ] Pass birth data into `buildZiweiSection` and add an interactive-chart container before the existing textual summary.
- [ ] Mount only after a valid 12-palace result; preserve the current structured unavailable state when calculation fails.
- [ ] Show local loading and error states without blocking the remaining BaZi/AI result.
- [ ] Load the generated bundle before `main.js` and version every modified immutable asset.

### Task 4: Responsive and deployment verification

**Files:**
- Modify: `THIRD_PARTY_NOTICES.md`
- Test: all automated suites

- [ ] Add MIT attribution for React, ReactDOM, and react-iztro.
- [ ] Run `npm run build:ziwei-chart`, `npm test`, syntax checks, and `git diff --check`.
- [ ] Browser-test a valid chart on desktop and 390×844 mobile, including horizontal navigation, chart interactions, fallback, and console health.

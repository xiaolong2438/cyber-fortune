# Cross-Platform Chart Fingerprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the React Ziwei chart build fingerprint deterministic across Windows and Linux line endings.

**Architecture:** Keep the current three fingerprint inputs and banner format, but normalize text line endings to LF before hashing in both the esbuild script and its runtime/artifact test. Rebuild the checked-in JS, CSS, and source map so the generated banners use the normalized fingerprint.

**Tech Stack:** Node.js, esbuild, Node `crypto`, Node assertion tests.

---

### Task 1: Add the failing cross-platform fingerprint assertion

**Files:**
- Modify: `test/react-iztro-runtime-tests.js:150-166`

- [ ] **Step 1: Update the test hash input to normalize line endings**

Change the existing fingerprint loop to decode each input as UTF-8 and replace `\\r\\n?` with `\\n` before updating the hash:

```js
fingerprintFiles.forEach((file) => {
    const normalized = fs.readFileSync(path.join(rootDir, file), 'utf8').replace(/\\r\\n?/g, '\\n');
    buildHash.update(file).update(normalized);
});
```

- [ ] **Step 2: Run the focused test and confirm the expected failure**

Run: `node test/react-iztro-runtime-tests.js`

Expected: FAIL with `built chart JavaScript is stale; run npm run build:ziwei-chart`, because the existing artifact still contains the pre-normalization fingerprint.

### Task 2: Make the build fingerprint use the same normalization

**Files:**
- Modify: `scripts/esbuild-ziwei-chart.mjs:10-12`

- [ ] **Step 1: Normalize each build input before hashing**

Use UTF-8 text reads and the same `/\\r\\n?/g` replacement as the test:

```js
for (const file of fingerprintFiles) {
    const source = await readFile(file, 'utf8');
    buildHash.update(file).update(source.replace(/\\r\\n?/g, '\\n'));
}
```

- [ ] **Step 2: Rebuild the checked-in chart assets**

Run: `npm run build:ziwei-chart`

Expected: esbuild exits 0 and updates `js/vendor/react-iztro-chart.js`, `js/vendor/react-iztro-chart.css`, and `js/vendor/react-iztro-chart.js.map` with one shared `build-sha256` value.

- [ ] **Step 3: Run the focused test and confirm it passes**

Run: `node test/react-iztro-runtime-tests.js`

Expected: `✓ react-iztro runtime and artifact tests passed`.

### Task 3: Verify the complete deployment test suite

**Files:**
- No additional files.

- [ ] **Step 1: Check the generated diff**

Run: `git diff --check` and confirm it exits 0; leave unrelated `.bak` files untouched.

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: every test group passes, including the runtime/artifact test, and the command exits 0.

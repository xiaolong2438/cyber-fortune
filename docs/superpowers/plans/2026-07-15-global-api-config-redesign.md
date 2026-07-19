# Global API Configuration Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or execute this plan inline task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current cramped global AI configuration modal with a clear provider-first workflow that supports loading models, testing a connection, saving configuration, inline feedback, and responsive mobile use.

**Architecture:** Keep the existing vanilla HTML/CSS/JavaScript stack and the current `AiConfig`, `ConfigManager`, and `ApiClient` boundaries. Redesign only the configuration surface and add small interaction helpers inside `AiConfig`; preserve the proxy and URL-normalization fixes already present in the working tree.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js assertion tests, Cloudflare Pages Functions.

---

### Task 1: Lock the UI contract with a failing test

**Files:**
- Create: `test/api-config-ui-tests.js`
- Test: `index.html`, `css/style.css`, `js/config/ai-config.js`

- [ ] **Step 1: Write the failing contract test**

```javascript
assert.match(indexHtml, /role="dialog"/);
assert.match(indexHtml, /id="provider-options"/);
assert.match(indexHtml, /id="toggle-api-key"/);
assert.match(indexHtml, /id="reset-api-url"/);
assert.match(indexHtml, /id="config-feedback"/);
assert.doesNotMatch(aiConfigJs, /alert\(/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node test/api-config-ui-tests.js`

Expected: FAIL because the redesigned controls and inline feedback region do not exist.

### Task 2: Replace the modal information architecture

**Files:**
- Modify: `index.html:30-121`

- [ ] **Step 1: Implement the provider rail and ordered form**

Use one modal frame with this hierarchy:

```html
<div class="config-shell" role="document">
  <aside class="provider-panel" id="provider-options"></aside>
  <form class="config-workspace" id="global-config-form"></form>
</div>
```

The form contains API URL, password visibility control, model reload, connection status, inline feedback, browser-storage note, reset, test, and save controls. Retain the existing element IDs consumed by `AiConfig`.

- [ ] **Step 2: Run the UI contract test**

Run: `node test/api-config-ui-tests.js`

Expected: still FAIL until styles and inline message behavior are implemented.

### Task 3: Implement the visual system and responsive layout

**Files:**
- Modify: `css/style.css:105-351`

- [ ] **Step 1: Implement desktop tokens and layout**

Use a maximum 920px dialog, 184px provider rail, 48px control heights, maximum 8px radii, restrained cyan focus states, magenta only for the primary save action, and neutral borders.

- [ ] **Step 2: Implement mobile layout**

At `max-width: 720px`, make the dialog full-height, provider options a two-row grid, form controls one column, and actions sticky at the bottom with no horizontal overflow.

- [ ] **Step 3: Verify the CSS contract**

Run: `node test/api-config-ui-tests.js`

Expected: only JavaScript behavior assertions remain failing.

### Task 4: Implement accessible interactions and inline feedback

**Files:**
- Modify: `js/config/ai-config.js`
- Modify: `test/api-config-ui-tests.js`

- [ ] **Step 1: Replace alerts with an inline status region**

```javascript
showMessage(message, type = 'info') {
  const feedback = document.getElementById('config-feedback');
  feedback.dataset.type = type;
  feedback.textContent = message;
  feedback.hidden = false;
}
```

- [ ] **Step 2: Add provider buttons, URL reset, password visibility, loading labels, focus restoration, and form submission behavior**

Provider buttons synchronize the existing hidden/select value, update the default base URL, reload recommended models, and update the selected state. Password visibility changes only the input type and accessible label.

- [ ] **Step 3: Run RED/GREEN tests**

Run: `node test/api-config-ui-tests.js && node test/api-routing-tests.js`

Expected: both suites PASS.

### Task 5: Browser fidelity and workflow verification

**Files:**
- Temporary concept: outside committed source
- Screenshot evidence: outside committed source

- [ ] **Step 1: Start a local static/proxy test server**

Run the existing mock setup on a clean loopback origin so no saved API key is read.

- [ ] **Step 2: Verify desktop workflow**

Flow: homepage -> open Global AI Configuration -> select provider -> enter full endpoint and fake key -> load models -> test connection state -> save state.

- [ ] **Step 3: Verify mobile workflow**

Set viewport to `390x844`; verify provider grid, fields, sticky actions, no clipping, and no horizontal overflow.

- [ ] **Step 4: Run final verification**

Run: `node test/run-tests.js`, `node test/api-routing-tests.js`, `node test/api-config-ui-tests.js`, JavaScript syntax checks, `git diff --check`, and Browser console/screenshot checks.

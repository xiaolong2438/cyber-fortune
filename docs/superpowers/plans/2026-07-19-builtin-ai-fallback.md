# Built-in AI Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every AI analysis automatically use a Cloudflare-hosted default OpenAI-compatible API when the visitor has not saved a complete personal API configuration.

**Architecture:** Keep the built-in endpoint, key, and model exclusively in Cloudflare environment variables. The browser represents fallback with a non-secret sentinel config and posts a `mode: "builtin"` request to the existing same-origin Pages Function; the Function replaces all client model/auth values with server values and enforces input/output limits. Complete personal configurations continue through the current allowlisted proxy unchanged.

**Tech Stack:** Vanilla JavaScript, Cloudflare Pages Functions, Node.js contract tests.

---

### Task 1: Built-in proxy contract

**Files:**
- Modify: `test/api-routing-tests.js`
- Modify: `functions/api/proxy.js`

- [ ] **Step 1: Write the failing tests**

Add tests proving that a built-in request uses `BUILTIN_AI_API_URL`, `BUILTIN_AI_API_KEY`, and `BUILTIN_AI_MODEL`; ignores client target/auth/model values; caps `max_tokens`; and returns HTTP 503 when server configuration is missing.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/api-routing-tests.js`

Expected: FAIL because `mode: "builtin"` is not implemented.

- [ ] **Step 3: Implement the minimal server route**

Add a built-in branch before the user-configured target branch. Validate server environment, normalize messages, enforce `BUILTIN_AI_MAX_INPUT_CHARS` and `BUILTIN_AI_MAX_TOKENS`, replace the model and Authorization header on the server, and return upstream streaming bodies without logging secrets.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node test/api-routing-tests.js`

Expected: all API routing tests pass.

### Task 2: Browser fallback routing

**Files:**
- Modify: `test/api-routing-tests.js`
- Modify: `js/config/api-client.js`
- Modify: `js/main.js`

- [ ] **Step 1: Write the failing tests**

Add tests proving that `ApiClient.requestAIResponse()` sends sentinel requests to the same-origin Function without a browser key, that incomplete saved config resolves to built-in config, and that complete personal config remains preferred.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/api-routing-tests.js`

Expected: FAIL because the client currently requires URL and key and `getGlobalConfig()` returns partial config.

- [ ] **Step 3: Implement the minimal client fallback**

Add a shared built-in config constant, route it through `/api/proxy` with `mode: "builtin"`, and update `getGlobalConfig()` to return personal config only when URL, key, and model are all present.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node test/api-routing-tests.js`

Expected: all API routing tests pass.

### Task 3: Explain fallback in the configuration UI

**Files:**
- Modify: `test/api-config-ui-tests.js`
- Modify: `index.html`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

Require the API panel to state that personal configuration is optional and that the built-in key remains on Cloudflare.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/api-config-ui-tests.js`

Expected: FAIL because no fallback copy exists.

- [ ] **Step 3: Add UI and deployment documentation**

Update the security note and document `BUILTIN_AI_API_URL`, `BUILTIN_AI_API_KEY`, `BUILTIN_AI_MODEL`, optional token/input caps, and Cloudflare rate-limiting guidance.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/api-config-ui-tests.js`

Expected: all configuration UI tests pass.

### Task 4: Full verification

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run focused tests**

Run: `node test/api-routing-tests.js && node test/api-config-ui-tests.js`

- [ ] **Step 2: Run full tests and checks**

Run: `npm test`

Run: `node --check js/main.js`

Run: `node --check js/config/api-client.js`

Run: `node --check functions/api/proxy.js`

Run: `git diff --check`

- [ ] **Step 3: Validate the rendered flow**

The flow under test is: open the app without a saved personal API configuration -> submit an AI-backed analysis -> request is routed to the same-origin built-in Function -> UI shows the AI result or the explicit “built-in AI not configured” server error.

# Oracle Poem Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render AI-generated oracle poems as readable paired verse instead of literal LaTeX source.

**Architecture:** Normalize only legacy LaTeX `aligned` poem blocks before the existing Markdown and DOMPurify pipeline. Keep the prompt, renderer, styles, and regression test focused on this output format.

**Tech Stack:** Vanilla JavaScript, Marked, DOMPurify, CSS, Node assertion tests.

---

### Task 1: Reproduce the literal LaTeX output

**Files:**
- Modify: `test/ceming-ai-scoring-tests.js`

- [ ] Add the reported `aligned` poem to a rendering test.
- [ ] Run `node test/ceming-ai-scoring-tests.js` and confirm it fails because LaTeX commands remain visible.

### Task 2: Normalize and style the poem

**Files:**
- Modify: `js/main.js`
- Modify: `js/bazi-calculator.js`
- Modify: `css/style.css`

- [ ] Add the legacy poem normalizer and call it before Markdown rendering.
- [ ] Forbid LaTeX in the Bazi AI prompt and require plain Markdown verse.
- [ ] Add responsive paired-line styles.
- [ ] Run the focused test and confirm it passes.

### Task 3: Verify the application

**Files:**
- No additional files.

- [ ] Run syntax checks and `git diff --check`.
- [ ] Run `npm test` and confirm every test passes.

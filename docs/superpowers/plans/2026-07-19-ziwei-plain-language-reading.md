# 紫微斗数白话解读 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在完整星盘之后提供无需 AI 配置即可阅读的白话基础解读，让普通用户知道结论、依据和可执行提醒。

**Architecture:** 保留 `ZiweiCalculator` 负责排盘与结构化数据，新增 `ZiweiInterpreter` 负责确定性的本命盘解释，`CyberFortune` 只负责安全渲染。解释器只依据命盘已有宫位、主星、亮度和四化，不推测未提供的流年信息。

**Tech Stack:** Vanilla JavaScript、iztro 2.5.3、Node `vm` 测试、现有 HTML/CSS 页面。

---

### Task 1: 保留解释所需星曜证据

**Files:**
- Modify: `js/ziwei-calculator.js`
- Test: `test/ziwei-calculator-tests.js`

- [ ] **Step 1: Write the failing test**

```js
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.palaces[0].majorStarDetails[0])),
    { name: '紫微', brightness: '旺', mutagen: '权' }
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/ziwei-calculator-tests.js`

Expected: FAIL because `majorStarDetails` is missing.

- [ ] **Step 3: Implement structured star details**

```js
formatStarDetails(stars) {
    return stars.map((star) => typeof star === 'string'
        ? { name: star, brightness: '', mutagen: '' }
        : { name: star.name || String(star), brightness: star.brightness || '', mutagen: star.mutagen || '' });
}
```

- [ ] **Step 4: Run the test**

Run: `node test/ziwei-calculator-tests.js`

Expected: PASS.

### Task 2: 新增白话解释器

**Files:**
- Create: `js/ziwei-interpreter.js`
- Create: `test/ziwei-interpreter-tests.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing behavior tests**

```js
const reading = new ZiweiInterpreter().interpret(result);
assert.strictEqual(reading.sections.length, 6);
assert.deepStrictEqual(reading.sections.map((item) => item.id),
    ['self', 'career', 'wealth', 'relationship', 'wellbeing', 'opportunity']);
assert.match(reading.sections[0].evidence, /命宫.*紫微.*旺.*化权/);
assert.match(reading.sections[4].disclaimer, /不替代医疗建议/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/ziwei-interpreter-tests.js`

Expected: FAIL because `js/ziwei-interpreter.js` does not exist.

- [ ] **Step 3: Implement deterministic interpretation**

```js
class ZiweiInterpreter {
    interpret(result) {
        return { overview: this.buildOverview(result), sections: this.buildSections(result), disclaimer: '传统文化参考' };
    }
}
window.ZiweiInterpreter = ZiweiInterpreter;
```

The implementation includes the fourteen major-star profiles, empty-palace fallback, brightness/four-transformation evidence, and six domain configurations.

- [ ] **Step 4: Run focused tests**

Run: `node test/ziwei-interpreter-tests.js`

Expected: PASS.

### Task 3: Render the reading in the result page

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `css/style.css`
- Modify: `test/react-iztro-integration-tests.js`

- [ ] **Step 1: Add failing UI contract assertions**

```js
assert.match(html, /js\/ziwei-interpreter\.js\?v=/);
assert.match(main, /buildZiweiReading/);
assert.match(main, /一眼看懂这张盘/);
assert.match(css, /\.ziwei-reading-list/);
```

- [ ] **Step 2: Run contract test and confirm RED**

Run: `node test/react-iztro-integration-tests.js`

Expected: FAIL because the interpreter and reading UI are not wired.

- [ ] **Step 3: Add accessible plain-language layout**

```js
const reading = this.ziweiInterpreter?.interpret(ziweiResult);
const readingHtml = this.buildZiweiReading(reading);
```

Render each topic as an `article` with visible conclusion, evidence, watch point and advice. Escape every interpreter string with `escapeHTML`.

- [ ] **Step 4: Run contract and full tests**

Run: `npm test`

Expected: all tests PASS.

### Task 4: Browser QA

**Files:**
- No production file changes unless QA finds a reproducible defect.

- [ ] **Step 1: Generate a known chart**

Use male, `1990-06-15 10:30`, Beijing, then verify the reading appears immediately below the chart.

- [ ] **Step 2: Verify readable and responsive states**

Check desktop and `390x844`: six topics, no clipped text, no page-level horizontal overflow, and the original chart remains independently scrollable.

- [ ] **Step 3: Verify console and final commands**

Run: `npm test`, `node --check js/main.js`, `node --check js/ziwei-interpreter.js`, and `git diff --check`.

Expected: zero failures and no relevant browser console errors.

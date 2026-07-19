const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const context = {
    window: { addEventListener() {} },
    document: { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } },
    console,
    setTimeout,
    clearTimeout
};
vm.createContext(context);
vm.runInContext(`${source}\nwindow.__CyberFortuneForTest = CyberFortune;`, context, { filename: 'js/main.js' });
const CyberFortune = context.window.__CyberFortuneForTest;
const failures = [];

function test(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        failures.push({ name, error });
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

const candidatePool = ['李明哲', '李修远', '李弘毅', '李博文', '李云帆', '李凌云'].map((fullName) => ({
    fullName,
    firstName: fullName.slice(1),
    score: 80,
    wuXingMatch: ['木', '水'],
    sanCai: { jiXiong: '中吉' },
    source: { work: '《测试原典》', quote: '测试原文' },
    characterDetails: []
}));

test('naming AI parser accepts exactly five ranked candidates with reasons', () => {
    const instance = Object.create(CyberFortune.prototype);
    const response = `报告正文\n\n\`\`\`json\n${JSON.stringify({
        topNames: candidatePool.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            fullName: item.fullName,
            score: 95 - index,
            reason: `${item.fullName}的独立推荐理由`,
            tradeoff: '需要结合实际读音复核'
        })),
        summary: '综合排名已完成'
    })}\n\`\`\``;
    const parsed = instance.parseAINamingTop5Response(response, candidatePool);
    assert.strictEqual(parsed.topNames.length, 5);
    assert.strictEqual(parsed.topNames[0].fullName, '李明哲');
    assert.strictEqual(parsed.topNames[0].aiScore, 95);
    assert.match(parsed.topNames[0].reason, /独立推荐理由/);
});

test('naming AI parser rejects incomplete or invented rankings', () => {
    const instance = Object.create(CyberFortune.prototype);
    const incomplete = JSON.stringify({
        topNames: candidatePool.slice(0, 4).map((item, index) => ({ fullName: item.fullName, score: 90 - index, reason: '理由' }))
    });
    const invented = JSON.stringify({
        topNames: [...candidatePool.slice(0, 4), { fullName: '李不存在' }].map((item, index) => ({ fullName: item.fullName, score: 90 - index, reason: '理由' }))
    });
    assert.strictEqual(instance.parseAINamingTop5Response(incomplete, candidatePool), null);
    assert.strictEqual(instance.parseAINamingTop5Response(invented, candidatePool), null);
});

test('naming AI parser accepts all available names when custom constraints leave fewer than five', () => {
    const instance = Object.create(CyberFortune.prototype);
    const limitedPool = candidatePool.slice(0, 1);
    const response = JSON.stringify({ topNames: [{ fullName: limitedPool[0].fullName, score: 88, reason: '完全指定用字' }] });
    const parsed = instance.parseAINamingTop5Response(response, limitedPool);
    assert.strictEqual(parsed.topNames.length, 1);
});

test('structured ranking JSON is hidden from the readable AI report', () => {
    const instance = Object.create(CyberFortune.prototype);
    const content = '可读报告正文\n```json\n{"topNames":[]}\n```';
    assert.strictEqual(instance.stripAINamingRankingJSON(content), '可读报告正文');
});

test('ranked name cards show the verified source for every given-name character', () => {
    const instance = Object.create(CyberFortune.prototype);
    const item = {
        ...candidatePool[0],
        aiScore: 95,
        reason: '字义和音形协调',
        tradeoff: '复核方言读音',
        source: { work: '《诗经》', section: '大雅', author: '佚名', quote: '既明且哲，以保其身。' }
    };
    const html = instance.renderAINamingTop5Cards([item]);
    assert.match(html, /逐字取字依据/);
    assert.match(html, /<strong>明<\/strong>：取自 《诗经》 · 大雅 · 佚名/);
    assert.match(html, /<strong>哲<\/strong>：取自 《诗经》 · 大雅 · 佚名/);
    assert.match(html, /既明且哲，以保其身/);
});

test('naming result hides the local ten-card pool and exposes waiting progress', () => {
    const start = source.indexOf('displayQimingResult(');
    const end = source.indexOf('getAvailableNameElements(', start);
    const displaySource = source.slice(start, end);
    assert.doesNotMatch(displaySource, /id="names-grid"/);
    assert.match(displaySource, /id="ai-naming-top5-grid"/);
    assert.match(source, /正在检索典籍出处并进行 AI 综合排名/);
    assert.match(source, /已检索.*条已核验经典语料/);
    assert.match(source, /已形成.*个合规候选/);
});

if (failures.length) process.exit(1);
console.log('\nAll naming AI ranking tests passed.');

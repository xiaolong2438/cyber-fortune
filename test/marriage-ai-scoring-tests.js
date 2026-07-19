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

const marriageData = {
    male: { name: '甲', year: 1990, month: 1, day: 1, hour: 10, minute: 0, birthProvince: '北京', birthCity: '北京' },
    female: { name: '乙', year: 1992, month: 2, day: 2, hour: 12, minute: 0, birthProvince: '上海', birthCity: '上海' }
};
const marriageResult = {
    totalScore: 88,
    level: '非常匹配',
    shengXiaoMatch: { score: 90, analysis: '生肖证据' },
    wuXingMatch: { score: 80, analysis: '五行证据' },
    shiShenMatch: { score: 75, analysis: '十神证据' },
    ageMatch: { score: 85, analysis: '年龄证据' },
    suggestions: ['规则建议']
};

test('marriage prompt treats mechanical matching as evidence and requires an independent AI score', () => {
    const instance = Object.create(CyberFortune.prototype);
    instance.getZodiacAnimal = (year) => year === 1990 ? '马' : '猴';
    const prompt = instance.generateMarriageAIPrompt(marriageData, marriageResult);
    assert.match(prompt, /仅作参考证据/);
    assert.match(prompt, /最终综合评分必须由你完成全部维度分析后独立给出/);
    assert.match(prompt, /"score":0到100的整数/);
});

test('marriage AI parser accepts bounded structured scores and preserves dimensions', () => {
    const instance = Object.create(CyberFortune.prototype);
    const parsed = instance.parseMarriageAIResponse('```json\n{"score":84,"confidence":"中","summary":"互补明显","dimensions":{"沟通":82,"价值观":86},"analysis":"需保持沟通"}\n```');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(parsed)), {
        score: 84,
        confidence: '中',
        summary: '互补明显',
        dimensions: { 沟通: 82, 价值观: 86 },
        analysis: '需保持沟通'
    });
});

test('invalid marriage AI scores never fall back to the mechanical score', () => {
    const instance = Object.create(CyberFortune.prototype);
    assert.strictEqual(instance.parseMarriageAIResponse('分析完成但没有结构化评分'), null);
    assert.strictEqual(instance.parseMarriageAIResponse('{"score":101}'), null);
    assert.strictEqual(instance.parseMarriageAIResponse('{"score":-1}'), null);
});

test('marriage result waits for AI score instead of displaying mechanical totals', () => {
    assert.match(source, /id="marriage-ai-score-number">--/);
    assert.match(source, /等待大模型完成综合判断/);
    assert.doesNotMatch(source, /<span class="score-number">\$\{marriageResult\.totalScore\}<\/span>/);
    assert.doesNotMatch(source, /<span class="score-text">\$\{marriageResult\.shengXiaoMatch\.score\}分<\/span>/);
    assert.doesNotMatch(source, /<div class="match-details">/);
    assert.doesNotMatch(source, /marriageResult\.suggestions\.map/);
});

test('AI completion updates marriage score and leaves it unavailable on invalid output', () => {
    assert.match(source, /applyMarriageAIScore\(fullResponse\)/);
    assert.match(source, /applyMarriageAIScore\(content\)/);
    const instance = Object.create(CyberFortune.prototype);
    instance.marriageAIScoreResult = null;
    instance.fullMarriageAIResponse = '';
    assert.strictEqual(instance.getMarriageAIScoreResult(), null);
    instance.fullMarriageAIResponse = '{"score":91,"summary":"稳定互补"}';
    assert.strictEqual(instance.getMarriageAIScoreResult().score, 91);
});

test('marriage text and printable reports do not expose mechanical final scores', () => {
    const instance = Object.create(CyberFortune.prototype);
    assert.strictEqual(typeof instance.generateMarriagePrintableHTML, 'function');
    assert.doesNotMatch(source, /综合匹配度：\$\{marriageResult\.totalScore\}分/);
    assert.doesNotMatch(source, /<div style="font-size: 2\.5rem; font-weight: bold; color: #00d4ff;">\$\{marriageResult\.totalScore\}<\/div>/);
    assert.match(source, /getMarriageAIScoreResult\(\)/);
});

if (failures.length) process.exit(1);
console.log('\nAll marriage AI scoring tests passed.');

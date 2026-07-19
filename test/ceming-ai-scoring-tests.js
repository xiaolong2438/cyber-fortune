const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const nameCalculatorSource = fs.readFileSync(path.join(root, 'js/name-calculator.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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

test('AI prompt treats local score as reference evidence, not the final score', () => {
    const instance = Object.create(CyberFortune.prototype);
    instance.nameCalculator = { analyzeBaziWuXing: () => ['水'] };
    const prompt = instance.generateCemingAIPrompt(
        { fullName: '王小明', gender: '男', year: 1990, month: 1, day: 1, hour: 10, minute: 0, birthProvince: '北京市', birthCity: '北京市' },
        { wuGe: { tianGe: 5, renGe: 7, diGe: 11, waiGe: 9, zongGe: 15 }, sanCai: { tianWuXing: '土', renWuXing: '金', diWuXing: '木', jiXiong: '吉' }, score: 66 },
        { yearPillar: '庚午', monthPillar: '己丑', dayPillar: '辛亥', hourPillar: '癸巳', yearTenGod: '比肩', monthTenGod: '正印', hourTenGod: '食神', dayTianGan: '辛' }
    );
    assert.match(prompt, /仅作参考证据|不得直接作为最终评分/);
    assert.match(prompt, /最终综合评分必须由你完成/);
});

test('Ceming prompt requires evidence grading and non-deterministic practical advice', () => {
    const instance = Object.create(CyberFortune.prototype);
    instance.nameCalculator = { analyzeBaziWuXing: () => ['水'] };
    const prompt = instance.generateCemingAIPrompt(
        { fullName: '王小明', gender: '男', year: 1990, month: 1, day: 1, hour: 10, minute: 0, birthProvince: '北京市', birthCity: '北京市' },
        { wuGe: { tianGe: 5, renGe: 7, diGe: 11, waiGe: 9, zongGe: 15 }, sanCai: { tianWuXing: '土', renWuXing: '金', diWuXing: '木', jiXiong: '吉' }, score: 66 },
        { yearPillar: '庚午', monthPillar: '己丑', dayPillar: '辛亥', hourPillar: '癸巳', yearTenGod: '比肩', monthTenGod: '正印', hourTenGod: '食神', dayTianGan: '辛' }
    );
    assert.match(prompt, /字义和出处采用证据分级/);
    assert.match(prompt, /不做确定性预测/);
    assert.match(prompt, /普通人能理解/);
    assert.match(prompt, /命理匹配30%、字义文化30%、音形美感25%、社会使用15%/);
    assert.match(prompt, /请按以下四段格式输出/);
    assert.match(prompt, /## 姓名综合结论/);
    assert.match(prompt, /## 关键证据/);
    assert.match(prompt, /## 优势与权衡/);
    assert.match(prompt, /## 最终建议/);
    assert.doesNotMatch(prompt, /### 🌟 人生指导/);
});

test('AI response parser accepts a bounded structured score and preserves detailed analysis', () => {
    const instance = Object.create(CyberFortune.prototype);
    const parsed = instance.parseCemingAIResponse('```json\n{"score":88,"confidence":"中","summary":"音形义协调","dimensions":{"命理匹配":86,"字义文化":92,"音形美感":87},"analysis":"建议保留并观察实际使用感受。"}\n```');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(parsed)), {
        score: 88,
        confidence: '中',
        summary: '音形义协调',
        dimensions: { '命理匹配': 86, '字义文化': 92, '音形美感': 87 },
        analysis: '建议保留并观察实际使用感受。'
    });
});

test('Ceming parser accepts malformed single-backtick JSON and hides it from readable output', () => {
    const instance = Object.create(CyberFortune.prototype);
    const content = '## 姓名综合结论\n建议保留。\n\n--\n\n`json\n{"score":82,"confidence":"高","summary":"整体协调","dimensions":{"命理匹配":95,"字义文化":88,"音形美感":82,"社会使用":80},"analysis":"优势与权衡"}\n`';
    const parsed = instance.parseCemingAIResponse(content);
    assert.strictEqual(parsed.score, 82);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(parsed.dimensions)), {
        命理匹配: 95,
        字义文化: 88,
        音形美感: 82,
        社会使用: 80
    });
    assert.strictEqual(instance.stripCemingScoringJSON(content), '## 姓名综合结论\n建议保留。');
});

test('invalid or missing AI scores never fall back to the local mechanical score', () => {
    const instance = Object.create(CyberFortune.prototype);
    assert.strictEqual(instance.parseCemingAIResponse('分析完成，但未给出评分。'), null);
    assert.strictEqual(instance.parseCemingAIResponse('{"score":120,"summary":"过界"}'), null);
    assert.strictEqual(instance.parseCemingAIResponse('{"score":-1,"summary":"过界"}'), null);
});

test('initial result UI waits for the AI score instead of rendering the local score as final', () => {
    assert.match(source, /id="ceming-ai-score-number">--/);
    assert.match(source, /等待大模型完成多维分析/);
    assert.doesNotMatch(source, /class="score-number">\$\{nameAnalysis\.score\}/);
});

test('AI completion updates the score in both streaming and fallback response paths', () => {
    assert.match(source, /applyCemingAIScore\(fullResponse\)/);
    assert.match(source, /applyCemingAIScore\(content\)/);
    assert.match(source, /formatMarkdown\(this\.stripCemingScoringJSON\(fullResponse\)\)/);
    assert.match(source, /formatMarkdown\(this\.stripCemingScoringJSON\(content\)\)/);
});

test('missing model and API failures leave the AI final score unavailable', () => {
    assert.match(source, /请输入模型名称/);
    assert.match(source, /AI综合评分未生成/);
});

test('mechanical score is internal evidence and is not displayed in results or exports', () => {
    assert.doesNotMatch(nameCalculatorSource, /本地规则参考分：\$\{score\}分/);
    assert.doesNotMatch(source, /report \+= `本地规则参考分：\$\{nameAnalysis\.score\}分/);
    assert.doesNotMatch(source, />\$\{nameAnalysis\.score\}<\/div>/);
});

test('Ceming AI score state is scoped only to Ceming report exports', () => {
    const scoreReads = source.match(/const aiScore = this\.getCemingAIScoreResult\(\);/g) || [];
    assert.strictEqual(scoreReads.length, 3);
});

test('all fallback AI formatters escape executable HTML from model output', () => {
    const instance = Object.create(CyberFortune.prototype);
    const malicious = '<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a>';
    const dangerousMarkup = /<(?:script|img)\b|\sonerror\s*=\s*["']|href\s*=\s*["']javascript:/i;

    assert.doesNotMatch(instance.formatMarkdown(malicious), dangerousMarkup);
    assert.doesNotMatch(instance.simpleMarkdownParse(malicious), dangerousMarkup);
    assert.doesNotMatch(instance.formatMarriageAIResponse(malicious), dangerousMarkup);
});

test('AI Markdown rendering is sanitized by a local DOMPurify loaded before main.js', () => {
    assert.match(indexHtml, /js\/vendor\/purify\.min\.js[^<]*<\/script>[\s\S]*js\/main\.js/);
    assert.match(source, /DOMPurify\.sanitize/);
    assert.match(source, /renderAIMarkdown\(fullResponse\)/);
    assert.doesNotMatch(source, /innerHTML\s*=\s*marked\.parse/);
});

if (failures.length) process.exit(1);
console.log('\nAll AI scoring tests passed.');

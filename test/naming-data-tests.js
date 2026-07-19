const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
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

function loadNameCalculator() {
    const kangxiPath = path.join(root, 'js/data/kangxi-strokes.js');
    const catalogPath = path.join(root, 'js/data/name-character-data.js');
    assert.ok(fs.existsSync(kangxiPath), 'complete Kangxi stroke data is missing');
    assert.ok(fs.existsSync(catalogPath), 'naming character catalog is missing');

    const context = { window: {}, console };
    vm.createContext(context);
    for (const file of [kangxiPath, catalogPath, path.join(root, 'js/name-calculator.js')]) {
        vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
    }
    return { NameCalculator: context.window.NameCalculator, context };
}

const mockBazi = {
    yearPillar: '庚午',
    monthPillar: '壬午',
    dayPillar: '甲子',
    hourPillar: '丁卯',
    dayTianGan: '甲'
};

test('Kangxi lookup contains the complete licensed dataset', () => {
    const { context } = loadNameCalculator();
    assert.ok(context.window.KangxiStrokeData.meta.recordCount >= 63000);
    assert.strictEqual(context.window.KangxiStrokeData.strokes['華'], 14);
});

test('naming catalog spans five elements and stroke-indexed characters', () => {
    const { NameCalculator, context } = loadNameCalculator();
    const calculator = new NameCalculator();
    const catalog = context.window.NameCharacterData.catalog;
    assert.ok(catalog.length >= 120, `catalog is too small: ${catalog.length}`);
    assert.deepStrictEqual(
        [...new Set(catalog.map(item => item.element))].sort(),
        ['土', '木', '水', '火', '金'].sort()
    );
    assert.ok(calculator.getCharactersByElementAndStrokes('木', 13).length > 0);
});

test('generated names are varied and every system result cites a classic', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const first = calculator.generateNameSuggestions('李', '男', mockBazi);
    const second = calculator.generateNameSuggestions('李', '男', mockBazi);

    assert.strictEqual(first.length, 24);
    assert.strictEqual(second.length, 24);
    assert.notDeepStrictEqual(first.map(item => item.fullName), second.map(item => item.fullName));

    for (const suggestion of first) {
        assert.ok(suggestion.score >= 0 && suggestion.score <= 100,
            `${suggestion.fullName} score outside 0-100: ${suggestion.score}`);
        assert.ok(suggestion.source?.work, `${suggestion.fullName} missing source work`);
        assert.ok(suggestion.source?.quote, `${suggestion.fullName} missing source quote`);
        assert.strictEqual(suggestion.characterDetails.length, 2);
        suggestion.characterDetails.forEach(detail => {
            assert.ok(Number.isInteger(detail.strokes) && detail.strokes > 0);
            assert.ok(['木', '火', '土', '金', '水'].includes(detail.element));
        });
    }
});

test('local naming pool filters obvious gender mismatches and avoids saturated scores', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const male = calculator.generateNameSuggestions('李', '男', mockBazi);
    const female = calculator.generateNameSuggestions('李', '女', mockBazi);
    const maleAvoid = new Set(['静姝', '柔嘉', '嘉卉', '令仪', '芳菲', '锦瑟', '婵娟', '晴柔', '疏影', '暗香', '溪亭']);
    const femaleAvoid = new Set(['维桢', '邦彦', '翰飞', '秉文', '修远', '正则', '广志', '弘毅', '博文', '浩然', '天行', '自强', '厚德', '凌云', '海日', '千帆']);

    assert.ok(male.every((item) => !maleAvoid.has(item.firstName)));
    assert.ok(female.every((item) => !femaleAvoid.has(item.firstName)));
    assert.ok(new Set(male.map((item) => item.score)).size > 1, 'male candidate scores are still saturated');
    assert.ok(new Set(female.map((item) => item.score)).size > 1, 'female candidate scores are still saturated');
});

test('naming AI prompt enforces source verification and practical guidance', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const suggestions = calculator.generateNameSuggestions('李', '男', mockBazi);
    const prompt = calculator.generateCompleteAINamingPrompt(
        { surname: '李', gender: '男', year: 1990, month: 1, day: 1, hour: 10, birthProvince: '北京', birthCity: '北京' },
        mockBazi,
        suggestions
    );

    assert.match(prompt, /出处必须可核验/);
    assert.match(prompt, /禁止补造诗句/);
    assert.match(prompt, /面向普通人写作/);
    assert.match(prompt, /JSON 代码块必须放在全文最后/);
    assert.match(prompt, /内部候选池：只用于比较，不得逐项输出/);
    assert.doesNotMatch(prompt, /请对每个姓名进行详细分析/);
    assert.doesNotMatch(prompt, /请你从以下维度对每个候选姓名进行专业分析/);
});

test('expert ranking prompt preserves custom character positions and forbids extra names', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const prompt = calculator.generateAINamingPrompt(
        { surname: '王', gender: '男', year: 1990, month: 1, day: 1, hour: 10, birthProvince: '北京', birthCity: '北京' },
        mockBazi,
        [],
        { firstChar: '弘', secondChar: '毅', candidateChars: ['文', '远'] }
    );

    assert.match(prompt, /只能在候选池内完成综合排名/);
    assert.match(prompt, /必须固定在名字的第一个位置，禁止调换到第二位/);
    assert.match(prompt, /必须固定在名字的第二个位置，禁止调换到第一位/);
    assert.match(prompt, /不得自行创造或追加“专家推荐名字”/);
    assert.doesNotMatch(prompt, /如果你认为有更优秀的名字推荐/);
    assert.match(prompt, /用户候选字逐字分析/);
    assert.match(prompt, /以上每个候选字都必须分析/);
    assert.match(prompt, /文：康熙4画/);
    assert.match(prompt, /远：康熙17画/);
    assert.match(prompt, /推荐\/谨慎\/不建议结论及理由/);
});

test('unknown elements remain unclassified instead of using stroke modulo', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    assert.strictEqual(calculator.getCharWuXing('龘'), null);
    const analysis = calculator.analyzeName('李龘', mockBazi);
    assert.deepStrictEqual(Array.from(analysis.unclassifiedChars), ['龘']);
});

test('custom character constraints remain honored', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const suggestions = calculator.generateNameSuggestions('王', '女', mockBazi, {
        firstChar: '清',
        secondChar: '扬',
        candidateChars: []
    });
    assert.strictEqual(suggestions[0].fullName, '王清扬');
    assert.strictEqual(suggestions[0].customType, '完全指定');
});

test('partial and candidate character constraints apply to every result', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    const firstOnly = calculator.generateNameSuggestions('王', '男', mockBazi, { firstChar: '志' });
    const secondOnly = calculator.generateNameSuggestions('王', '女', mockBazi, { secondChar: '宁' });
    const candidateOnly = calculator.generateNameSuggestions('王', '女', mockBazi, { candidateChars: ['清'] });

    assert.strictEqual(firstOnly.length, 24);
    assert.ok(firstOnly.every(item => item.firstName.startsWith('志')));
    assert.strictEqual(secondOnly.length, 24);
    assert.ok(secondOnly.every(item => item.firstName.endsWith('宁')));
    assert.strictEqual(candidateOnly.length, 24);
    assert.ok(candidateOnly.every(item => item.firstName.includes('清')));
});

test('gender influences the ranked naming batch', () => {
    const { NameCalculator } = loadNameCalculator();
    const male = new NameCalculator().generateNameSuggestions('李', '男', mockBazi);
    const female = new NameCalculator().generateNameSuggestions('李', '女', mockBazi);
    assert.notDeepStrictEqual(male.map(item => item.fullName), female.map(item => item.fullName));
});

test('ambiguous exact characters keep their own strokes while common simplified surnames use traditional form', () => {
    const { NameCalculator } = loadNameCalculator();
    const calculator = new NameCalculator();
    assert.strictEqual(calculator.getCharStrokes('后'), 6);
    assert.strictEqual(calculator.getCharStrokes('里'), 7);
    assert.strictEqual(calculator.getCharStrokes('张'), 11);
    assert.strictEqual(calculator.getCharacterInfo('云').traditionalForm, '雲');
});

if (failures.length > 0) {
    console.error(`\n${failures.length} naming data test(s) failed.`);
    process.exit(1);
}

console.log('\nAll naming data tests passed.');

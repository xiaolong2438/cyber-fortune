const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'js/ziwei-interpreter.js');

if (!fs.existsSync(sourcePath)) {
    console.error('FAIL ZiweiInterpreter source is missing');
    process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf8');
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'js/ziwei-interpreter.js' });
const ZiweiInterpreter = context.window.ZiweiInterpreter;
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

function palace(name, earthlyBranch, stars) {
    return {
        name,
        earthlyBranch,
        majorStars: stars.map((star) => star.name),
        majorStarDetails: stars,
        minorStars: [],
        minorStarDetails: []
    };
}

function makeResult() {
    return {
        available: true,
        calculationMethod: 'iztro',
        earthlyBranchOfSoulPalace: '子',
        earthlyBranchOfBodyPalace: '丑',
        fiveElementsClass: '火六局',
        soul: '巨门',
        body: '火星',
        palaces: [
            palace('命宫', '子', [{ name: '紫微', brightness: '旺', mutagen: '权' }]),
            palace('兄弟', '丑', [{ name: '天机', brightness: '庙', mutagen: '' }]),
            palace('夫妻', '寅', [{ name: '太阴', brightness: '庙', mutagen: '科' }]),
            palace('子女', '卯', [{ name: '天同', brightness: '得', mutagen: '' }]),
            palace('财帛', '辰', [{ name: '天府', brightness: '庙', mutagen: '禄' }]),
            palace('疾厄', '巳', [{ name: '天梁', brightness: '旺', mutagen: '' }]),
            palace('迁移', '午', [{ name: '七杀', brightness: '旺', mutagen: '' }]),
            palace('仆役', '未', [{ name: '贪狼', brightness: '平', mutagen: '' }]),
            palace('官禄', '申', [{ name: '武曲', brightness: '庙', mutagen: '忌' }]),
            palace('田宅', '酉', [{ name: '天相', brightness: '得', mutagen: '' }]),
            palace('福德', '戌', [{ name: '天同', brightness: '庙', mutagen: '' }]),
            palace('父母', '亥', [{ name: '太阳', brightness: '旺', mutagen: '' }])
        ]
    };
}

test('plain-language reading covers six everyday topics with chart evidence', () => {
    const reading = new ZiweiInterpreter().interpret(makeResult());
    assert.strictEqual(reading.available, true);
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(reading.sections.map((section) => section.id))),
        ['self', 'career', 'wealth', 'relationship', 'wellbeing', 'opportunity']
    );
    assert.match(reading.overview.headline, /紫微/);
    assert.match(reading.sections[0].evidence, /命宫（子）.*紫微（旺）化权/);
    assert.match(reading.sections[0].strengths, /统筹|担当/);
    assert.match(reading.sections[1].watchFor, /压力|得失|效率/);
    assert.match(reading.sections[3].evidence, /夫妻宫（寅）.*太阴（庙）化科/);
    assert.match(reading.sections[4].disclaimer, /不替代医疗建议/);
});

test('empty palaces produce a cautious explanation instead of invented claims', () => {
    const result = makeResult();
    result.palaces = result.palaces.map((item) => ({ ...item, majorStars: [], majorStarDetails: [] }));
    const reading = new ZiweiInterpreter().interpret(result);
    assert.match(reading.sections[0].summary, /不适合单独下结论|暂不单独下结论/);
    assert.match(reading.sections[0].evidence, /空宫|暂无十四主星/);
    assert.match(reading.disclaimer, /传统文化参考/);
});

test('unavailable charts return an unavailable reading', () => {
    const reading = new ZiweiInterpreter().interpret({ available: false, warning: '命盘不可用' });
    assert.strictEqual(reading.available, false);
    assert.match(reading.message, /命盘不可用/);
    assert.strictEqual(reading.sections.length, 0);
});

test('supporting-star transformations are preserved as evidence without driving the major-star profile', () => {
    const result = makeResult();
    const migration = result.palaces.find((item) => item.name === '迁移');
    migration.majorStars = [];
    migration.majorStarDetails = [];
    migration.minorStars = ['文曲'];
    migration.minorStarDetails = [{ name: '文曲', brightness: '旺', mutagen: '忌' }];

    const reading = new ZiweiInterpreter().interpret(result);
    const opportunity = reading.sections.find((section) => section.id === 'opportunity');
    assert.match(opportunity.summary, /暂无十四主星/);
    assert.match(opportunity.evidence, /辅星文曲（旺）化忌/);
    assert.match(opportunity.watchFor, /文曲化忌/);
});

test('brightness adjusts confidence wording for the same major star', () => {
    const brightResult = makeResult();
    brightResult.palaces.find((item) => item.name === '命宫').majorStarDetails[0].brightness = '庙';
    const brightReading = new ZiweiInterpreter().interpret(brightResult).sections[0];

    const challengedResult = makeResult();
    challengedResult.palaces.find((item) => item.name === '命宫').majorStarDetails[0].brightness = '陷';
    const challengedReading = new ZiweiInterpreter().interpret(challengedResult).sections[0];

    assert.match(brightReading.strengths, /传统解释中更容易显现/);
    assert.match(challengedReading.watchFor, /更受情境和经验影响/);
    assert.notStrictEqual(brightReading.strengths, challengedReading.strengths);
});

test('mixed known and unknown major stars are explicitly described as a partial interpretation', () => {
    const result = makeResult();
    const soul = result.palaces.find((item) => item.name === '命宫');
    soul.majorStars.push('未收录星');
    soul.majorStarDetails.push({ name: '未收录星', brightness: '平', mutagen: '' });

    const section = new ZiweiInterpreter().interpret(result).sections[0];
    assert.match(section.watchFor, /仅解释已覆盖星曜/);
    assert.match(section.watchFor, /未收录星/);
});

test('dual-major-star soul palaces are represented in the overview', () => {
    const result = makeResult();
    const soul = result.palaces.find((item) => item.name === '命宫');
    soul.majorStars.push('贪狼');
    soul.majorStarDetails.push({ name: '贪狼', brightness: '旺', mutagen: '' });

    const overview = new ZiweiInterpreter().interpret(result).overview;
    assert.match(overview.headline, /紫微.*贪狼/);
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(overview.tags.slice(0, 2))),
        ['紫微', '贪狼']
    );
});

test('an unknown major star is not described as an empty palace', () => {
    const result = makeResult();
    const soul = result.palaces.find((item) => item.name === '命宫');
    soul.majorStars = ['未收录星'];
    soul.majorStarDetails = [{ name: '未收录星', brightness: '平', mutagen: '' }];

    const section = new ZiweiInterpreter().interpret(result).sections[0];
    assert.match(section.summary, /词典尚未覆盖/);
    assert.doesNotMatch(section.watchFor, /空宫不等于/);
    assert.match(section.watchFor, /不将其当作空宫/);
});

test('supporting evidence highlights transformations and summarizes untransformed stars', () => {
    const result = makeResult();
    const soul = result.palaces.find((item) => item.name === '命宫');
    soul.minorStarDetails = [
        { name: '文曲', brightness: '旺', mutagen: '忌' },
        { name: '左辅', brightness: '', mutagen: '' }
    ];
    soul.adjectiveStarDetails = [
        { name: '天喜', brightness: '', mutagen: '' },
        { name: '天德', brightness: '', mutagen: '' }
    ];

    const evidence = new ZiweiInterpreter().interpret(result).sections[0].evidence;
    assert.match(evidence, /辅星文曲（旺）化忌/);
    assert.match(evidence, /另有辅星1颗、杂曜2颗/);
    assert.doesNotMatch(evidence, /左辅|天喜|天德/);
});

if (failures.length > 0) {
    console.error(`\n${failures.length} Ziwei interpreter test(s) failed.`);
    process.exit(1);
}

console.log('\nAll Ziwei interpreter tests passed.');

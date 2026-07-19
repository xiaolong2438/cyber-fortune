const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/ziwei-calculator.js'), 'utf8');
const failures = [];

function makeAstrolabe() {
    return {
        solarDate: '1990-05-15',
        lunarDate: '一九九〇年四月廿一',
        chineseDate: '庚午 辛巳 庚辰',
        time: '晚子时',
        timeRange: '23:00~00:00',
        sign: '金牛座',
        zodiac: '马',
        earthlyBranchOfSoulPalace: '子',
        earthlyBranchOfBodyPalace: '丑',
        soul: '贪狼',
        body: '火星',
        fiveElementsClass: '火六局',
        palaces: Array.from({ length: 12 }, (_, index) => ({
            name: index === 0 ? '命宫' : `宫位${index}`,
            heavenlyStem: '甲',
            earthlyBranch: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][index],
            majorStars: [{ name: '紫微', brightness: '旺', mutagen: '权' }],
            minorStars: [],
            adjectiveStars: [],
            changsheng12: '长生',
            decadal: { range: [1, 10] },
            ages: [1, 13]
        }))
    };
}

function loadCalculator(iztro) {
    const context = { window: {}, console, iztro };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/ziwei-calculator.js' });
    return context.window.ZiweiCalculator;
}

function test(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        failures.push({ name, error });
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

test('Ziwei uses the documented bySolar API and late-rat time index', () => {
    let args;
    const ZiweiCalculator = loadCalculator({
        astro: {
            bySolar(...values) {
                args = values;
                return makeAstrolabe();
            }
        }
    });
    const calculator = new ZiweiCalculator();
    const result = calculator.calculate({
        year: 1990,
        month: 5,
        day: 15,
        hour: 23,
        minute: 30,
        gender: '男'
    });

    assert.deepStrictEqual(Array.from(args), ['1990-05-15', 12, '男', true, 'zh-CN']);
    assert.strictEqual(result.available, true);
    assert.strictEqual(result.palaces.length, 12);
    assert.strictEqual(result.palaces[0].heavenlyStem, '甲');
    assert.strictEqual(result.palaces[0].changsheng12, '长生');
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(result.palaces[0].majorStarDetails[0])),
        { name: '紫微', brightness: '旺', mutagen: '权' }
    );
});

test('midnight uses early-rat time index', () => {
    let timeIndex;
    const ZiweiCalculator = loadCalculator({
        astro: {
            bySolar(date, time) {
                timeIndex = time;
                return makeAstrolabe();
            }
        }
    });
    new ZiweiCalculator().calculate({
        year: 1990, month: 5, day: 15, hour: 0, minute: 30, gender: '女'
    });
    assert.strictEqual(timeIndex, 0);
});

test('invalid birth data returns a structured unavailable result', () => {
    const ZiweiCalculator = loadCalculator({ astro: { bySolar: () => makeAstrolabe() } });
    const result = new ZiweiCalculator().calculate({
        year: 2023, month: 2, day: 30, hour: 12, minute: 0, gender: '男'
    });
    assert.strictEqual(result.available, false);
    assert.strictEqual(result.errorCode, 'INVALID_BIRTH_DATA');
    assert.match(result.warning, /日期/);
});

test('missing iztro returns an explicit unavailable result', () => {
    const ZiweiCalculator = loadCalculator(undefined);
    const result = new ZiweiCalculator().calculate({
        year: 1990, month: 5, day: 15, hour: 10, minute: 0, gender: '男'
    });
    assert.strictEqual(result.available, false);
    assert.strictEqual(result.errorCode, 'IZTRO_UNAVAILABLE');
    assert.strictEqual(result.palaces.length, 0);
});

if (failures.length > 0) {
    console.error(`\n${failures.length} Ziwei test(s) failed.`);
    process.exit(1);
}

console.log('\nAll Ziwei calculator tests passed.');

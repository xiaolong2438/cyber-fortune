const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const failures = [];

function loadCyberFortune(overrides = {}) {
    const context = {
        window: { addEventListener() {} },
        document: { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } },
        console,
        setTimeout,
        clearTimeout,
        ...overrides
    };
    vm.createContext(context);
    vm.runInContext(`${source}\nwindow.__CyberFortuneForTest = CyberFortune;`, context, { filename: 'js/main.js' });
    return { CyberFortune: context.window.__CyberFortuneForTest, context };
}

async function test(name, fn) {
    try {
        await fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        failures.push({ name, error });
        console.error(`FAIL ${name}: ${error.message}`);
    }
}

(async () => {
    await test('Ziwei chart is captured from the full chart frame for the printable report', async () => {
        const chartFrame = { scrollWidth: 860, scrollHeight: 640 };
        const chartRoot = { getAttribute: () => 'false' };
        let capturedElement;
        let capturedOptions;
        const { CyberFortune } = loadCyberFortune({
            html2canvas: async (element, options) => {
                capturedElement = element;
                capturedOptions = options;
                return { toDataURL: () => 'data:image/png;base64,ZIWEI_CHART' };
            }
        });
        const instance = Object.create(CyberFortune.prototype);
        const resultContent = {
            querySelector(selector) {
                if (selector === '.ziwei-chart-frame') return chartFrame;
                if (selector === '#ziwei-chart-root') return chartRoot;
                return null;
            }
        };

        assert.strictEqual(typeof instance.captureZiweiChartImage, 'function');
        const image = await instance.captureZiweiChartImage(resultContent);
        assert.strictEqual(image, 'data:image/png;base64,ZIWEI_CHART');
        assert.strictEqual(capturedElement, chartFrame);
        assert.strictEqual(capturedOptions.width, 860);
        assert.strictEqual(capturedOptions.height, 640);
    });

    await test('printable Ziwei section embeds the captured chart image', () => {
        const { CyberFortune } = loadCyberFortune();
        const instance = Object.create(CyberFortune.prototype);
        const ziweiSection = {
            querySelector() { return null; }
        };
        const resultContent = {
            querySelector(selector) {
                return selector === '.ziwei-section' ? ziweiSection : null;
            }
        };

        const html = instance.generateZiweiHTML(resultContent, {
            chartImageDataUrl: 'data:image/png;base64,ZIWEI_CHART'
        });
        assert.match(html, /class="ziwei-chart-print-image"/);
        assert.match(html, /src="data:image\/png;base64,ZIWEI_CHART"/);
        assert.match(html, /紫微斗数完整星盘/);
    });

    await test('printable report forwards the captured chart to the Ziwei section', () => {
        const resultContent = {
            querySelector(selector) {
                if (selector === '.result-title' || selector === '.result-info') return { textContent: '' };
                return null;
            }
        };
        const { CyberFortune, context } = loadCyberFortune();
        context.document.querySelector = (selector) => selector === '#zhiming-result .result-content' ? resultContent : null;
        context.document.getElementById = () => null;
        const instance = Object.create(CyberFortune.prototype);
        instance.generateBaziHTML = () => '';
        instance.generateSolarTimeHTML = () => '';
        instance.generateDayunHTML = () => '';
        instance.generateZiweiHTML = (_content, options) => options?.chartImageDataUrl ? '<div>CHART_INCLUDED</div>' : '<div>CHART_MISSING</div>';

        const html = instance.generatePrintableHTML({
            chartImageDataUrl: 'data:image/png;base64,ZIWEI_CHART'
        });
        assert.match(html, /CHART_INCLUDED/);
        assert.doesNotMatch(html, /CHART_MISSING/);
    });

    await test('PDF button opens the report window before capturing and forwards the chart image', async () => {
        const events = [];
        const popup = { document: {} };
        const chartFrame = {};
        const chartRoot = {};
        const resultContent = {
            querySelector(selector) {
                if (selector === '.ziwei-chart-frame') return chartFrame;
                if (selector === '#ziwei-chart-root') return chartRoot;
                return null;
            }
        };
        const { CyberFortune, context } = loadCyberFortune({
            setTimeout(callback) { callback(); }
        });
        context.document.querySelector = (selector) => selector === '#zhiming-result .result-content' ? resultContent : null;
        context.window.open = () => {
            events.push('popup');
            return popup;
        };
        const instance = Object.create(CyberFortune.prototype);
        instance.showProcessing = () => {};
        instance.hideProcessing = () => {};
        instance.showError = (message) => { throw new Error(message); };
        instance.showSuccess = () => {};
        instance.captureZiweiChartImage = async (content) => {
            assert.strictEqual(content, resultContent);
            events.push('capture');
            return 'data:image/png;base64,ZIWEI_CHART';
        };
        instance.openPrintPreview = (openedPopup, options) => {
            events.push('preview');
            assert.strictEqual(openedPopup, popup);
            assert.strictEqual(options.chartImageDataUrl, 'data:image/png;base64,ZIWEI_CHART');
        };

        await instance.downloadPDFReport();
        assert.deepStrictEqual(events, ['popup', 'capture', 'preview']);
    });

    await test('PDF export still opens when the Ziwei chart is unavailable', async () => {
        const events = [];
        const popup = { document: {}, close() { events.push('close'); } };
        const resultContent = { querySelector() { return null; } };
        const { CyberFortune, context } = loadCyberFortune();
        context.document.querySelector = (selector) => selector === '#zhiming-result .result-content' ? resultContent : null;
        context.window.open = () => popup;
        const instance = Object.create(CyberFortune.prototype);
        instance.currentZiweiData = { available: false };
        instance.showProcessing = () => {};
        instance.hideProcessing = () => {};
        instance.showError = (message) => { throw new Error(message); };
        instance.captureZiweiChartImage = async () => {
            events.push('capture');
            throw new Error('unavailable chart must not be captured');
        };
        instance.openPrintPreview = (openedPopup, options) => {
            events.push('preview');
            assert.strictEqual(openedPopup, popup);
            assert.strictEqual(options.chartImageDataUrl, null);
        };

        await instance.downloadPDFReport();
        assert.deepStrictEqual(events, ['preview']);
    });

    if (failures.length > 0) {
        console.error(`\n${failures.length} PDF report test(s) failed.`);
        process.exit(1);
    }

    console.log('\nAll PDF report tests passed.');
})();

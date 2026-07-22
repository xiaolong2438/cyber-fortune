const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
const mainJs = read('js/main.js');
const css = read('css/style.css');
const assistantPath = path.join(root, 'js/ui/form-assistant.js');

function formMarkup(id) {
    const start = html.indexOf(`<form id="${id}"`);
    const end = html.indexOf('</form>', start);
    assert.ok(start >= 0 && end > start, `missing form ${id}`);
    return html.slice(start, end);
}

function testMarkupContract() {
    ['zhiming-form', 'qiming-form', 'ceming-form'].forEach((id) => {
        const markup = formMarkup(id);
        assert.match(markup, /data-reuse-profile/, `${id} should expose recent profile reuse`);
        assert.match(markup, /data-clear-profile/, `${id} should expose recent profile clearing`);
        assert.match(markup, /role="status"/, `${id} should expose inline feedback`);
        assert.match(markup, /novalidate/, `${id} should use accessible inline validation`);
    });

    const hehun = formMarkup('hehun-form');
    assert.match(hehun, /data-profile-target="male"/);
    assert.match(hehun, /data-profile-target="female"/);
    assert.match(hehun, /data-clear-profile/);
    assert.match(hehun, /role="status"/);

    assert.match(html, /id="nav-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="nav-menu"/s);
    assert.match(html, /id="nav-menu"/);
    assert.match(html, /id="config-toggle"[^>]*aria-label="AI 配置"/s);

    const ceming = formMarkup('ceming-form');
    assert.strictEqual((ceming.match(/<option value="4">04时<\/option>/g) || []).length, 1,
        'ceming should contain exactly one 04 hour option');
}

function testNamingControls() {
    ['ai-naming-top5', 'ai-naming-top5-empty', 'ai-naming-top5-grid',
        'ai-naming-processing', 'ai-naming-processing-message'].forEach((id) => {
        assert.ok(mainJs.includes(`id="${id}"`), `missing AI naming state ${id}`);
    });
    const displayStart = mainJs.indexOf('displayQimingResult(');
    const displayEnd = mainJs.indexOf('getAvailableNameElements(', displayStart);
    const displayMarkup = mainJs.slice(displayStart, displayEnd);
    assert.doesNotMatch(displayMarkup, /id="(?:name-element-filter|name-sort|favorite-names-only|names-grid)"/,
        'local ten-name explorer should not be rendered');
    assert.match(mainJs, /parseAINamingTop5Response/);
    assert.match(mainJs, /applyAINamingTop5/);
    assert.match(mainJs, /clearTimeout\(this\.namingAnalysisTimer\)/);
    assert.match(mainJs, /this\.namingAnalysisAbortController\?\.abort\(\)/);
    assert.match(mainJs, /generationId !== this\.namingAnalysisGeneration/);
    assert.match(mainJs, /focusSectionHeading/);
    assert.match(mainJs, /navToggle\.focus\(\)/);
    assert.match(mainJs, /candidateChars\.map\(\(char\) => this\.escapeHTML\(char\)\)\.join/,
        'candidate character display must escape hostile markup');
    assert.match(css, /\.ai-naming-top5/);
    assert.match(css, /\.ai-name-reason/);
    assert.match(css, /\.nav-toggle/);
    assert.match(mainJs, /populateDays\(\)[\s\S]*while \(select\.children\.length > 1\)/,
        'dynamic day options should be idempotent');
    assert.match(mainJs, /populateProvinces\(\)[\s\S]*while \(select\.children\.length > 1\)/,
        'dynamic province options should be idempotent');
}

function testMobileContentWidthContract() {
    assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.section\s*\{[\s\S]*?padding:\s*1\.4rem 0\.5rem 2\.5rem;/,
        'mobile sections should keep compact page gutters');
    assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.content-container\s*\{[\s\S]*?width:\s*100%;/,
        'mobile content container should use the available width');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#zhiming-result,\s*#qiming-result,\s*#ceming-result,\s*#hehun-result\s*\{[\s\S]*?padding:\s*0\.75rem;/,
        'mobile result cards should use compact padding');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#qiming-result \.ai-result-section,[\s\S]*?padding:\s*0\.75rem;/,
        'mobile AI sections should not add excessive horizontal padding');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#qiming-result \.ai-output,[\s\S]*?padding:\s*0\.75rem;/,
        'mobile AI output should preserve readable width');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#qiming-result \.ai-naming-analysis,[\s\S]*?padding:\s*0;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/,
        'mobile AI naming analysis should flatten its outer card');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#qiming-result \.ai-result-section,[\s\S]*?padding:\s*0;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/,
        'mobile AI result section should flatten its nested card');
    assert.match(css, /@media \(max-width: 560px\)[\s\S]*?#qiming-result \.ai-output,[\s\S]*?padding:\s*0;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/,
        'mobile AI output should flatten its innermost card');
}

function testUnifiedResultLayoutContract() {
    const sharedDesktopWorkspace = /#zhiming \.content-container\.has-result,\s*#qiming \.content-container\.has-result,\s*#ceming \.content-container\.has-result,\s*#hehun \.content-container\.has-result\s*\{[\s\S]*?max-width:\s*1440px;[\s\S]*?grid-template-columns:\s*minmax\(300px, 360px\) minmax\(0, 1fr\);/;
    assert.match(css, sharedDesktopWorkspace,
        'all visible result workspaces should use the Zhiming desktop width and columns');

    const mobileMedia = css.slice(css.indexOf('@media (max-width: 768px)'), css.indexOf('@media (max-width: 720px)'));
    const sharedMobileWorkspace = /#zhiming \.content-container\.has-result,\s*#qiming \.content-container\.has-result,\s*#ceming \.content-container\.has-result,\s*#hehun \.content-container\.has-result\s*\{[\s\S]*?max-width:\s*1040px;[\s\S]*?grid-template-columns:\s*1fr;/;
    assert.match(mobileMedia, sharedMobileWorkspace,
        'all visible result workspaces should use the same mobile single-column width');

    assert.match(css, /#zhiming-result,\s*#qiming-result,\s*#ceming-result,\s*#hehun-result\s*\{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;/,
        'all result panels should share the same width and shrinking guards');
    assert.match(css, /#zhiming-result \.result-actions,\s*#qiming-result \.result-actions,\s*#ceming-result \.result-actions,\s*#hehun-result \.result-actions\s*\{/,
        'all result panels should share the same action layout');
    ['displayZhimingResult', 'displayQimingResult', 'displayCemingResult', 'displayHehunResult'].forEach((method) => {
        const start = mainJs.indexOf(`\n    ${method}(`);
        const end = mainJs.indexOf('\n    }', start);
        assert.ok(start >= 0 && end > start, `missing ${method}`);
        assert.match(mainJs.slice(start, end), /closest\('\.content-container'\)\?\.classList\.add\('has-result'\)/,
            `${method} should mark its workspace as containing a result`);
    });
}

function createStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
    };
}

function testProfilePrivacyContract() {
    assert.ok(fs.existsSync(assistantPath), 'missing form assistant module');
    const storage = createStorage();
    global.window = {};
    global.localStorage = storage;
    eval(read('js/ui/form-assistant.js'));

    const FormAssistant = global.window.FormAssistant;
    assert.ok(FormAssistant, 'FormAssistant should be exported to window');

    FormAssistant.saveRecent({
        gender: '女', year: 2001, month: 2, day: 3, hour: 4, minute: 5,
        birthProvince: '浙江省', birthCity: '杭州市',
        fullName: '不应保存', surname: '不应保存', apiKey: 'secret', apiUrl: 'https://secret.test', model: 'secret-model'
    }, storage);

    const savedRaw = storage.getItem(FormAssistant.STORAGE_KEY);
    const saved = JSON.parse(savedRaw);
    assert.deepStrictEqual(Object.keys(saved).sort(), [
        'birthCity', 'birthProvince', 'day', 'gender', 'hour', 'minute', 'month', 'year'
    ]);
    assert.ok(!savedRaw.includes('secret'));
    assert.ok(!savedRaw.includes('不应保存'));
    assert.deepStrictEqual(FormAssistant.loadRecent(storage), saved);
    assert.ok(storage.getItem(FormAssistant.STORAGE_TIMESTAMP_KEY));
    assert.strictEqual(FormAssistant.escapeHTML('<img src=x onerror="alert(1)">'),
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');

    const blockedStorage = {
        getItem: () => null,
        setItem: () => { throw new Error('storage blocked'); }
    };
    assert.doesNotThrow(() => FormAssistant.saveRecent(saved, blockedStorage));
    assert.strictEqual(FormAssistant.saveRecent(saved, blockedStorage), null);
    storage.setItem(FormAssistant.STORAGE_KEY, '{}');
    assert.strictEqual(FormAssistant.loadRecent(storage), null);
    assert.strictEqual(FormAssistant.clearRecent(storage), true);
    assert.strictEqual(storage.getItem(FormAssistant.STORAGE_KEY), null);
    FormAssistant.saveRecent(saved, storage);
    storage.setItem(FormAssistant.STORAGE_TIMESTAMP_KEY, String(Date.now() - FormAssistant.MAX_PROFILE_AGE - 1));
    assert.strictEqual(FormAssistant.loadRecent(storage), null);
    assert.strictEqual(storage.getItem(FormAssistant.STORAGE_KEY), null);
    assert.match(read('js/ui/form-assistant.js'), /field\.labels\?\.length/,
        'unlabelled secondary controls should receive an accessible name');
}

try {
    testMarkupContract();
    testNamingControls();
    testMobileContentWidthContract();
    testUnifiedResultLayoutContract();
    testProfilePrivacyContract();
    console.log('✓ usability UI and privacy tests passed');
} catch (error) {
    console.error(`✗ usability UI test failed: ${error.message}`);
    process.exit(1);
}

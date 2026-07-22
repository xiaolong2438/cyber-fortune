const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const aiConfigJs = fs.readFileSync(path.join(root, 'js/config/ai-config.js'), 'utf8');
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

test('configuration panel exposes an accessible dialog structure', () => {
    assert.match(indexHtml, /id="global-config-panel"[^>]*role="dialog"/);
    assert.match(indexHtml, /aria-modal="true"/);
    assert.match(indexHtml, /aria-labelledby="config-title"/);
    assert.match(indexHtml, /id="global-config-form"/);
});

test('provider-first controls and utility actions exist', () => {
    assert.match(indexHtml, /id="provider-options"/);
    for (const provider of ['deepseek', 'openai', 'zhipu', 'custom']) {
        assert.match(indexHtml, new RegExp(`data-provider="${provider}"`));
    }
    assert.doesNotMatch(indexHtml, /data-provider="(?:anthropic|alibaba)"/);
    assert.match(indexHtml, /id="toggle-api-key"/);
    assert.match(indexHtml, /id="reset-api-url"/);
    assert.match(indexHtml, /id="reset-global-config"/);
});

test('model selection is unrestricted and contains no recommendations', () => {
    assert.match(indexHtml, /<input[^>]*id="global-model"[^>]*list="global-model-options"/);
    assert.match(indexHtml, /<datalist[^>]*id="global-model-options"/);
    assert.doesNotMatch(indexHtml, /DeepSeek-R1|GPT-4|推荐模型/);
    assert.doesNotMatch(aiConfigJs, /loadRecommendedModels|getRecommendedModels/);
});

test('feedback is inline and the redesigned panel contains no emoji controls', () => {
    assert.match(indexHtml, /id="config-feedback"[^>]*role="status"/);
    assert.match(indexHtml, /id="config-security-note"/);
    assert.doesNotMatch(aiConfigJs, /alert\s*\(/);

    const panelMarkup = indexHtml.match(/<!-- 全局AI配置面板 -->([\s\S]*?)<!-- 主页面 -->/)[1];
    assert.doesNotMatch(panelMarkup, /[🤖⚙️💾🔍🔄⚪🟢🔴🟡]/u);
});

test('configuration styles implement the desktop shell and mobile collapse', () => {
    assert.match(styleCss, /\.config-shell\s*\{/);
    assert.match(styleCss, /\.provider-option\s*\{/);
    assert.match(styleCss, /max-width:\s*920px/);
    assert.match(styleCss, /@media\s*\(max-width:\s*720px\)/);
    assert.match(styleCss, /\.config-actions[^}]*position:\s*sticky/s);
});

test('AiConfig implements inline messages and password visibility', () => {
    assert.match(aiConfigJs, /config-feedback/);
    assert.match(aiConfigJs, /toggle-api-key/);
    assert.match(aiConfigJs, /reset-api-url/);
    assert.match(aiConfigJs, /selectProvider\s*\(/);
});

test('configuration panel explains the automatic built-in AI fallback', () => {
    assert.match(indexHtml, /未填写完整的个人 API 配置时[^<]*自动使用站点内置 AI/);
    assert.match(indexHtml, /内置密钥[^<]*Cloudflare 服务端/);
});

test('connection testing validates the entered model at the chat endpoint', () => {
    assert.match(aiConfigJs, /requestAIResponse\s*\(/);
    assert.doesNotMatch(aiConfigJs, /validateConfig\(baseUrl, apiKey, provider\)/);
});

test('modified immutable assets use the current cache version', () => {
    const versionedAssets = {
        'css/style.css': '20260722layout2',
        'js/ziwei-calculator.js': '20260721',
        'js/name-calculator.js': '20260721',
        'js/config/config-manager.js': '20260721',
        'js/config/ai-config.js': '20260721'
    };
    for (const [asset, version] of Object.entries(versionedAssets)) {
        assert.match(indexHtml, new RegExp(`${asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${version}`));
    }
    for (const asset of ['js/config/api-client.js', 'js/main.js']) {
        const version = asset === 'js/main.js' ? '20260722layout1' : '20260719builtin1';
        assert.match(indexHtml, new RegExp(`${asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${version}`));
    }
});

if (failures.length > 0) {
    console.error(`\n${failures.length} API configuration UI test(s) failed.`);
    process.exit(1);
}

console.log('\nAll API configuration UI tests passed.');

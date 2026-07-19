const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

try {
    const pkg = JSON.parse(read('package.json'));
    const html = read('index.html');
    const main = read('js/main.js');
    const css = read('css/style.css');
    const readme = read('README.md');
    const notices = read('THIRD_PARTY_NOTICES.md');
    const bundleLicense = read('scripts/licenses/react-iztro-bundle.LICENSE');

    assert.strictEqual(pkg.dependencies?.['react-iztro'], '1.4.2');
    assert.strictEqual(pkg.dependencies?.html2canvas, '1.4.1');
    assert.match(pkg.dependencies?.react || '', /^18\./);
    assert.match(pkg.dependencies?.['react-dom'] || '', /^18\./);
    assert.match(pkg.scripts?.['build:ziwei-chart'] || '', /esbuild-ziwei-chart/);
    assert.match(read('scripts/esbuild-ziwei-chart.mjs'), /'process\.env\.NODE_ENV': '\"production\"'/);

    assert.ok(exists('js/ui/ziwei-chart-entry.jsx'), 'missing React chart entry');
    assert.ok(exists('js/ziwei-interpreter.js'), 'missing plain-language Ziwei interpreter');
    assert.ok(exists('js/vendor/react-iztro-chart.js'), 'missing built React chart bundle');
    assert.ok(exists('js/vendor/react-iztro-chart.css'), 'missing built React chart styles');

    const entry = read('js/ui/ziwei-chart-entry.jsx');
    assert.match(entry, /import\s+\{\s*Iztrolabe\s*\}\s+from\s+['"]react-iztro['"]/);
    assert.match(entry, /import\s+html2canvas\s+from\s+['"]html2canvas['"]/);
    assert.match(entry, /window\.html2canvas\s*=\s*html2canvas/);
    assert.match(entry, /createRoot/);
    assert.match(entry, /hour\s*===\s*23\s*\?\s*12/);
    assert.match(entry, /window\.ZiweiChart/);
    assert.match(entry, /componentDidCatch/);
    assert.match(entry, /enhanceInteractiveControls/);
    assert.match(entry, /setAttribute\('role', 'button'\)/);
    assert.match(entry, /event\.key === 'Enter'/);
    assert.match(entry, /\.solar-horoscope \.today/);
    assert.match(entry, /attributes:\s*true/);
    assert.match(entry, /attributeFilter:\s*\['class'\]/);

    assert.match(main, /buildZiweiSection\(ziweiResult,\s*birthData\)/);
    assert.match(main, /id="ziwei-chart-root"/);
    assert.match(main, /mountZiweiChart/);
    assert.match(main, /ziwei-chart-fallback/);
    assert.match(main, /new window\.ZiweiInterpreter/);
    assert.match(main, /buildZiweiReading/);
    assert.match(main, /一眼看懂这张盘/);
    assert.match(main, /this\.escapeHTML\(section\.summary\)/);

    assert.match(html, /js\/vendor\/react-iztro-chart\.css\?v=/);
    assert.match(html, /js\/vendor\/react-iztro-chart\.js\?v=/);
    assert.match(html, /js\/ziwei-interpreter\.js\?v=/);
    assert.ok(html.indexOf('js/ziwei-interpreter.js') < html.indexOf('js/main.js'), 'interpreter must load before main.js');
    assert.match(html, /<noscript>/);
    assert.match(css, /\.ziwei-chart-viewport/);
    assert.match(css, /overflow-x:\s*auto/);
    assert.match(css, /\.ziwei-reading-list/);
    assert.match(css, /\.ziwei-reading-item/);
    assert.match(readme, /react-iztro/);
    assert.match(readme, /npm run build:ziwei-chart/);
    assert.match(notices, /Copyright \(c\) 2023 Sylar Long/);
    assert.match(notices, /Copyright \(c\) Facebook, Inc\. and its affiliates\./);
    assert.match(notices, /Copyright \(c\) 2023 Sylar/);
    assert.match(notices, /Copyright \(c\) 2018 Jed Watson/);
    assert.match(bundleLicense, /Permission is hereby granted, free of charge/);

    console.log('✓ react-iztro integration contract passed');
} catch (error) {
    console.error(`✗ react-iztro integration test failed: ${error.message}`);
    process.exit(1);
}

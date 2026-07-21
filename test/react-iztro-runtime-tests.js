const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const esbuild = require('esbuild');

const rootDir = path.join(__dirname, '..');

class FakeControl {
    constructor(classes, text = '测试控件') {
        this.classes = new Set(classes);
        this.attributes = new Map();
        this.textContent = text;
        this.clickCount = 0;
        this.classList = {
            contains: (name) => this.classes.has(name)
        };
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    closest() {
        return this;
    }

    click() {
        this.clickCount += 1;
    }
}

class FakeElement {
    constructor(controls = []) {
        this.controls = controls;
        this.attributes = new Map();
        this.dataset = {};
        this.listeners = new Map();
        this.textContent = '';
        this.isConnected = true;
        this.lastSelector = '';
    }

    querySelectorAll(selector) {
        this.lastSelector = selector;
        return this.controls;
    }

    addEventListener(name, handler) {
        this.listeners.set(name, handler);
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }
}

async function loadChartIsland() {
    const createdRoots = [];
    const observers = [];
    const rafCallbacks = [];
    const source = (await esbuild.transform(
        fs.readFileSync(path.join(rootDir, 'js/ui/ziwei-chart-entry.jsx'), 'utf8'),
        { loader: 'jsx', format: 'cjs', target: 'es2020' }
    )).code;

    class FakeMutationObserver {
        constructor(callback) {
            this.callback = callback;
            this.disconnected = false;
            observers.push(this);
        }

        observe(element, options) {
            this.element = element;
            this.options = options;
        }

        disconnect() {
            this.disconnected = true;
        }
    }

    class Component {}
    const React = { Component, createElement: (...args) => ({ args }) };
    const requireStub = (name) => {
        if (name === 'react') return { __esModule: true, default: React, Component };
        if (name === 'react-dom/client') {
            return {
                createRoot(element) {
                    const root = {
                        element,
                        renders: [],
                        unmounted: false,
                        render(node) { this.renders.push(node); },
                        unmount() { this.unmounted = true; }
                    };
                    createdRoots.push(root);
                    return root;
                }
            };
        }
        if (name === 'react-iztro') return { Iztrolabe() { return null; } };
        if (name === 'html2canvas') return { __esModule: true, default: async () => null };
        throw new Error(`Unexpected test import: ${name}`);
    };

    const sandbox = {
        Element: FakeElement,
        MutationObserver: FakeMutationObserver,
        Object,
        console,
        Date,
        Number,
        String,
        Map,
        Set,
        WeakMap,
        window: {},
        module: { exports: {} },
        exports: {},
        require: requireStub,
        __createdRoots: createdRoots,
        requestAnimationFrame: (callback) => rafCallbacks.push(callback)
    };
    sandbox.globalThis = sandbox;
    vm.runInNewContext(source, sandbox, { filename: 'ziwei-chart-entry.bundle.cjs' });

    return {
        api: sandbox.window.ZiweiChart,
        createdRoots,
        observers,
        flushRaf() {
            while (rafCallbacks.length) rafCallbacks.shift()();
        }
    };
}

function validBirthData() {
    return { year: 1990, month: 6, day: 15, hour: 10, gender: 'male' };
}

function assertBuiltArtifactIsCurrent() {
    const fingerprintFiles = [
        'js/ui/ziwei-chart-entry.jsx',
        'scripts/esbuild-ziwei-chart.mjs',
        'package-lock.json'
    ];
    const buildHash = crypto.createHash('sha256');
    fingerprintFiles.forEach((file) => {
        const normalized = fs.readFileSync(path.join(rootDir, file), 'utf8').replace(/\r\n?/g, '\n');
        buildHash.update(file).update(normalized);
    });
    const fingerprint = buildHash.digest('hex');
    const bundle = fs.readFileSync(path.join(rootDir, 'js/vendor/react-iztro-chart.js'), 'utf8');
    const styles = fs.readFileSync(path.join(rootDir, 'js/vendor/react-iztro-chart.css'), 'utf8');
    assert.match(bundle, new RegExp(`build-sha256:${fingerprint}`),
        'built chart JavaScript is stale; run npm run build:ziwei-chart');
    assert.match(styles, new RegExp(`build-sha256:${fingerprint}`),
        'built chart CSS is stale; run npm run build:ziwei-chart');
}

(async () => {
try {
    const { api, createdRoots, observers, flushRaf } = await loadChartIsland();
    assert.strictEqual(api.birthHourToIndex(23), 12, 'late-rat hour must map to index 12');

    const today = new FakeControl(['today'], '今');
    const element = new FakeElement([today]);
    assert.strictEqual(api.mount(element, validBirthData()).ok, true);
    flushRaf();
    assert.match(element.lastSelector, /\.solar-horoscope \.today/, 'today control must be keyboard enhanced');
    assert.strictEqual(today.getAttribute('role'), 'button');
    assert.strictEqual(today.getAttribute('tabindex'), '0');
    element.listeners.get('keydown')({ target: today, key: 'Enter', preventDefault() {} });
    assert.strictEqual(today.clickCount, 1, 'Enter must activate a chart control');

    today.classes.add('disabled');
    observers[0].callback();
    assert.strictEqual(today.getAttribute('tabindex'), '-1');
    assert.strictEqual(today.getAttribute('aria-disabled'), 'true');
    assert.strictEqual(observers[0].options.attributes, true, 'class mutations must be observed');
    assert.deepStrictEqual(Array.from(observers[0].options.attributeFilter), ['class']);

    const firstRoot = createdRoots[0];
    assert.strictEqual(api.mount(element, { year: 1990 }).ok, false);
    assert.strictEqual(firstRoot.unmounted, true, 'invalid remount must unmount the previous React root');
    assert.strictEqual(observers[0].disconnected, true, 'invalid remount must disconnect the previous observer');

    assert.strictEqual(api.mount(element, validBirthData()).ok, true);
    const secondRoot = createdRoots[1];
    assert.ok(secondRoot && secondRoot !== firstRoot, 'recovery must create a fresh React root');
    assert.strictEqual(element.attributes.has('role'), false, 'recovered chart must clear the prior alert role');
    assert.strictEqual(api.unmount(element), true);
    assert.strictEqual(secondRoot.unmounted, true);

    const raceElement = new FakeElement([new FakeControl(['today'], '今')]);
    const observerCountBeforeRace = observers.length;
    assert.strictEqual(api.mount(raceElement, validBirthData()).ok, true);
    assert.strictEqual(api.mount(raceElement, { year: 1990 }).ok, false);
    flushRaf();
    assert.strictEqual(raceElement.dataset.state, 'error', 'a stale frame must not overwrite the error state');
    assert.strictEqual(observers.length, observerCountBeforeRace, 'a stale frame must not create an observer');

    assertBuiltArtifactIsCurrent();
    console.log('✓ react-iztro runtime and artifact tests passed');
} catch (error) {
    console.error(`✗ react-iztro runtime test failed: ${error.message}`);
    process.exit(1);
}
})();

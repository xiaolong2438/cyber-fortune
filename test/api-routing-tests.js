const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const failures = [];

function loadBrowserClasses(hostname) {
    const context = {
        console,
        fetch: async () => {
            throw new Error('Unexpected network request');
        },
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        window: {
            location: { hostname, port: '' }
        }
    };

    vm.createContext(context);
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'js/config/api-client.js'), 'utf8'),
        context,
        { filename: 'api-client.js' }
    );
    context.ApiClient = context.window.ApiClient;
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'js/config/config-manager.js'), 'utf8'),
        context,
        { filename: 'config-manager.js' }
    );

    return {
        ApiClient: context.window.ApiClient,
        ConfigManager: context.window.ConfigManager,
        context
    };
}

function loadConfigUi() {
    class FakeElement {
        constructor() {
            this.listeners = {};
            this.style = {};
            this.value = '';
            this.disabled = false;
            this.textContent = '';
            this.innerHTML = '';
            this.options = [];
            this.dataset = {};
        }

        addEventListener(type, listener) {
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push(listener);
        }

        appendChild(child) {
            this.options.push(child);
            return child;
        }

        querySelector() {
            return new FakeElement();
        }
    }

    const elements = new Map();
    const document = {
        readyState: 'complete',
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, new FakeElement());
            return elements.get(id);
        },
        createElement() {
            return new FakeElement();
        },
        querySelectorAll() {
            return [];
        },
        addEventListener() {}
    };
    const context = {
        console,
        document,
        fetch: async () => {
            throw new Error('Unexpected network request');
        },
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        setTimeout: () => 0,
        clearTimeout: () => {},
        alert: () => {},
        window: {
            location: { hostname: 'cyber-fortune.pages.dev', port: '' },
            addEventListener() {}
        }
    };

    vm.createContext(context);
    for (const relativePath of [
        'js/config/api-client.js',
        'js/config/config-manager.js',
        'js/config/ai-config.js',
        'js/config/index.js'
    ]) {
        const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
        vm.runInContext(source, context, { filename: relativePath });
        if (context.window.ApiClient) context.ApiClient = context.window.ApiClient;
        if (context.window.ConfigManager) context.ConfigManager = context.window.ConfigManager;
        if (context.window.AiConfig) context.AiConfig = context.window.AiConfig;
    }

    const mainSource = fs.readFileSync(path.join(projectRoot, 'js/main.js'), 'utf8');
    vm.runInContext(`${mainSource}\nwindow.CyberFortune = CyberFortune;`, context, {
        filename: 'js/main.js'
    });

    return { context, elements };
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
    await test('Cloudflare model loading uses the same-origin proxy', async () => {
        const { ApiClient } = loadBrowserClasses('cyber-fortune.pages.dev');
        const client = new ApiClient();
        let proxyCalled = false;

        client.loadModelsViaCORSProxy = async () => {
            proxyCalled = true;
            return [{ id: 'deepseek-chat' }];
        };
        client.loadModelsDirectly = async () => {
            throw new Error('Direct model request must not run on Cloudflare');
        };

        const models = await client.getAvailableModels(
            'https://api.deepseek.com/v1/models',
            'test-key'
        );

        assert.strictEqual(proxyCalled, true);
        assert.strictEqual(models[0].id, 'deepseek-chat');
        assert.strictEqual(client.getWorkerProxyUrl(), '/api/proxy');
    });

    await test('Static local preview does not require a missing port-3000 proxy', async () => {
        const { ApiClient } = loadBrowserClasses('127.0.0.1');
        const client = new ApiClient();
        let directCalled = false;
        client.loadModelsDirectly = async () => {
            directCalled = true;
            return [{ id: 'local-preview-model' }];
        };
        client.loadModelsViaProxy = async () => {
            throw new Error('port 3000 proxy must not be required');
        };

        const models = await client.getAvailableModels('https://llm.example.com/v1/models', 'test-key');
        assert.strictEqual(directCalled, true);
        assert.strictEqual(models[0].id, 'local-preview-model');
    });

    await test('Custom domains use the same-origin proxy for legacy model loading', async () => {
        const { ApiClient } = loadBrowserClasses('fortune.example.com');
        const client = new ApiClient();
        let proxyCalled = false;

        client.loadModelsViaCORSProxy = async () => {
            proxyCalled = true;
            return [{ id: 'deepseek-chat' }];
        };
        client.loadModelsDirectly = async () => {
            throw new Error('Custom domains must not load models directly');
        };

        const models = await client.loadModels(
            'https://api.deepseek.com/v1/models',
            'test-key'
        );

        assert.strictEqual(proxyCalled, true);
        assert.strictEqual(models[0].id, 'deepseek-chat');
    });

    await test('Custom domains use the same-origin proxy for chat requests', async () => {
        const { ApiClient } = loadBrowserClasses('fortune.example.com');
        const client = new ApiClient();
        let proxyCalled = false;

        client.sendViaCORSProxy = async () => {
            proxyCalled = true;
            return { choices: [] };
        };
        client.sendDirectly = async () => {
            throw new Error('Custom domains must not send chat requests directly');
        };

        const result = await client.sendChatRequest(
            'https://api.deepseek.com/v1/chat/completions',
            'test-key',
            'deepseek-chat',
            []
        );

        assert.strictEqual(proxyCalled, true);
        assert.deepStrictEqual(result, { choices: [] });
    });

    await test('Built-in AI requests use the same-origin proxy without exposing a browser API key', async () => {
        const { ApiClient, context } = loadBrowserClasses('cyber-fortune.pages.dev');
        const client = new ApiClient();
        const builtinConfig = client.getBuiltinConfig();
        let requestUrl = '';
        let proxyPayload = null;

        context.fetch = async (url, options) => {
            requestUrl = String(url);
            proxyPayload = JSON.parse(options.body);
            return {
                ok: true,
                status: 200,
                headers: { get: () => 'application/json' },
                json: async () => ({ choices: [] })
            };
        };

        await client.requestAIResponse(
            builtinConfig.apiUrl,
            builtinConfig.apiKey,
            {
                model: builtinConfig.model,
                messages: [{ role: 'user', content: 'hello' }],
                stream: false
            }
        );

        assert.strictEqual(requestUrl, '/api/proxy');
        assert.strictEqual(proxyPayload.mode, 'builtin');
        assert.strictEqual(proxyPayload.targetUrl, undefined);
        assert.strictEqual(proxyPayload.headers, undefined);
        assert.strictEqual(proxyPayload.apiKey, undefined);
        assert.deepStrictEqual(proxyPayload.body.messages, [{ role: 'user', content: 'hello' }]);
    });

    await test('Built-in AI remains same-origin in local Cloudflare Pages development', async () => {
        const { ApiClient, context } = loadBrowserClasses('127.0.0.1');
        const client = new ApiClient();
        const builtinConfig = client.getBuiltinConfig();
        let requestUrl = '';
        context.fetch = async (url) => {
            requestUrl = String(url);
            return { ok: true, status: 200 };
        };

        await client.requestAIResponse(
            builtinConfig.apiUrl,
            builtinConfig.apiKey,
            { model: builtinConfig.model, messages: [{ role: 'user', content: 'hello' }] }
        );

        assert.strictEqual(requestUrl, '/api/proxy');
    });

    await test('Proxy failures never forward API keys to public CORS services', async () => {
        const { ApiClient, context } = loadBrowserClasses('cyber-fortune.pages.dev');
        const client = new ApiClient();
        const calls = [];

        context.fetch = async (url) => {
            calls.push(String(url));
            return {
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
                json: async () => ({ error: 'proxy unavailable' }),
                text: async () => 'proxy unavailable'
            };
        };

        await assert.rejects(() => client.loadModelsViaCORSProxy(
            'https://api.deepseek.com/v1/models',
            'test-key'
        ));
        assert.deepStrictEqual(calls, ['/api/proxy']);

        calls.length = 0;
        await assert.rejects(() => client.sendViaCORSProxy(
            'https://api.deepseek.com/v1/chat/completions',
            'test-key',
            { model: 'deepseek-chat', messages: [] }
        ));
        assert.deepStrictEqual(calls, ['/api/proxy']);
    });

    await test('Anthropic model loading uses x-api-key headers through the proxy', async () => {
        const { ApiClient, context } = loadBrowserClasses('cyber-fortune.pages.dev');
        const client = new ApiClient();
        let proxyPayload;
        context.fetch = async (url, options) => {
            proxyPayload = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ data: [{ id: 'claude-test' }] })
            };
        };

        await client.loadModelsViaCORSProxy('https://api.anthropic.com/v1/models', 'test-key', 'anthropic');
        assert.strictEqual(proxyPayload.headers['x-api-key'], 'test-key');
        assert.strictEqual(proxyPayload.headers['anthropic-version'], '2023-06-01');
        assert.strictEqual(proxyPayload.headers.Authorization, undefined);
    });

    await test('All browser AI calls use the shared proxy-aware client', () => {
        const mainSource = fs.readFileSync(path.join(projectRoot, 'js/main.js'), 'utf8');
        const clientSource = fs.readFileSync(path.join(projectRoot, 'js/config/api-client.js'), 'utf8');
        assert.doesNotMatch(mainSource, /fetch\(apiUrl/);
        assert.match(mainSource, /requestAIResponse\(/);
        assert.match(clientSource, /requestAIResponse\s*\(/);
    });

    await test('Full chat endpoint is normalized to the provider models endpoint', () => {
        const { ConfigManager } = loadBrowserClasses('cyber-fortune.pages.dev');
        const manager = new ConfigManager();

        assert.strictEqual(
            manager.getModelsUrl('deepseek', 'https://api.deepseek.com/v1/chat/completions'),
            'https://api.deepseek.com/v1/models'
        );
        assert.strictEqual(
            manager.getModelsUrl('openai', 'https://api.openai.com/v1/models'),
            'https://api.openai.com/v1/models'
        );
        assert.strictEqual(
            manager.getApiUrl('deepseek', 'https://api.deepseek.com/v1/chat/completions'),
            'https://api.deepseek.com/v1/chat/completions'
        );
        assert.strictEqual(
            manager.getApiUrl('openai', 'https://api.openai.com/v1/models'),
            'https://api.openai.com/v1/chat/completions'
        );
    });

    await test('Load models button has only one click handler', () => {
        const { context, elements } = loadConfigUi();
        const app = Object.create(context.window.CyberFortune.prototype);

        app.initNewConfigSystem();

        const listeners = elements.get('load-models-btn').listeners.click || [];
        assert.strictEqual(listeners.length, 1);
    });

    await test('Switching providers preserves a manually entered arbitrary model', () => {
        const { context, elements } = loadConfigUi();
        const aiConfig = context.window.ConfigSystem.getAIConfig();
        const modelInput = elements.get('global-model');
        modelInput.value = 'vendor/custom-model-v42';
        aiConfig.selectProvider('openai');
        assert.strictEqual(modelInput.value, 'vendor/custom-model-v42');
    });

    await test('Loading models keeps the model field empty until the user chooses one', async () => {
        const { context, elements } = loadConfigUi();
        const aiConfig = context.window.ConfigSystem.getAIConfig();
        const apiUrlInput = elements.get('global-api-url');
        const apiKeyInput = elements.get('global-api-key');
        const modelInput = elements.get('global-model');
        apiUrlInput.value = 'https://api.deepseek.com';
        apiKeyInput.value = 'test-key';
        modelInput.value = '';
        aiConfig.currentConfig.model = '';
        aiConfig.apiClient.getAvailableModels = async () => [
            { id: 'deepseek-chat', name: 'DeepSeek Chat' },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
        ];

        await aiConfig.loadModelsFromAPI(false);

        assert.strictEqual(modelInput.value, '');
        assert.strictEqual(elements.get('global-model-options').options.length, 2);
    });

    await test('Incomplete personal configuration automatically resolves to built-in AI', () => {
        const { context } = loadConfigUi();
        const app = Object.create(context.window.CyberFortune.prototype);
        app.aiConfig = { apiClient: new context.window.ApiClient() };
        app.configManager = {
            getConfig: () => ({
                apiUrl: 'https://api.deepseek.com/v1/chat/completions',
                apiKey: '',
                model: ''
            })
        };

        const config = app.getGlobalConfig();

        assert.strictEqual(config.useBuiltin, true);
        assert.strictEqual(config.apiUrl, 'builtin://cloudflare');
        assert.strictEqual(config.provider, 'builtin');
    });

    await test('Complete personal configuration remains preferred over built-in AI', () => {
        const { context } = loadConfigUi();
        const app = Object.create(context.window.CyberFortune.prototype);
        const personalConfig = {
            apiUrl: 'https://llm.example.com/v1/chat/completions',
            apiKey: 'personal-key',
            model: 'personal-model',
            provider: 'custom'
        };
        app.aiConfig = { apiClient: new context.window.ApiClient() };
        app.configManager = { getConfig: () => personalConfig };

        assert.strictEqual(app.getGlobalConfig(), personalConfig);
    });

    await test('API errors preserve string error messages from the built-in service', () => {
        const { context } = loadConfigUi();
        const app = Object.create(context.window.CyberFortune.prototype);

        assert.strictEqual(
            app.getApiErrorMessage({ error: '站点内置 AI 尚未配置，请联系管理员' }),
            '站点内置 AI 尚未配置，请联系管理员'
        );
        assert.strictEqual(
            app.getApiErrorMessage({ error: { message: '上游模型不可用' } }),
            '上游模型不可用'
        );
        assert.strictEqual(app.getApiErrorMessage({}, '备用错误'), '备用错误');
    });

    await test('browser logs never print complete API configuration objects', () => {
        const mainSource = fs.readFileSync(path.join(projectRoot, 'js/main.js'), 'utf8');
        assert.doesNotMatch(mainSource, /console\.log\(['"]获取全局配置:['"],\s*globalConfig\)/);
        assert.doesNotMatch(mainSource, /console\.log\(['"]获取到的AI配置:['"],\s*globalConfig\)/);
    });

    await test('Cloudflare Pages Function proxies an allowed AI request', async () => {
        const functionPath = path.join(projectRoot, 'functions/api/proxy.js');
        assert.strictEqual(fs.existsSync(functionPath), true, 'functions/api/proxy.js is missing');

        const source = fs.readFileSync(functionPath, 'utf8');
        const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
        const proxyModule = await import(moduleUrl);
        const originalFetch = global.fetch;
        let forwardedRequest = null;

        global.fetch = async (url, options) => {
            forwardedRequest = { url: String(url), options };
            return new Response(JSON.stringify({ data: [{ id: 'deepseek-chat' }] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        try {
            const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: 'https://api.deepseek.com/v1/models',
                    method: 'GET',
                    headers: { Authorization: 'Bearer test-key' }
                })
            });
            const response = await proxyModule.onRequest({ request, env: {} });
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.data[0].id, 'deepseek-chat');
            assert.strictEqual(forwardedRequest.url, 'https://api.deepseek.com/v1/models');
            assert.strictEqual(forwardedRequest.options.method, 'GET');
            assert.strictEqual(forwardedRequest.options.redirect, 'manual');
        } finally {
            global.fetch = originalFetch;
        }
    });

    await test('Cloudflare built-in AI uses only server-side endpoint, key and model', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const originalFetch = global.fetch;
        let forwardedRequest = null;

        global.fetch = async (url, options) => {
            forwardedRequest = {
                url: String(url),
                options,
                body: JSON.parse(options.body)
            };
            return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        try {
            const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Origin: 'https://cyber-fortune.pages.dev',
                    'CF-Connecting-IP': '203.0.113.10'
                },
                body: JSON.stringify({
                    mode: 'builtin',
                    targetUrl: 'https://api.openai.com/v1/chat/completions',
                    headers: { Authorization: 'Bearer browser-controlled-key' },
                    body: {
                        model: 'browser-controlled-model',
                        messages: [
                            { role: 'system', content: 'system prompt' },
                            { role: 'user', content: 'user prompt' }
                        ],
                        stream: true,
                        temperature: 0.6,
                        max_tokens: 9000
                    }
                })
            });

            const response = await proxyModule.onRequest({
                request,
                env: {
                    BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
                    BUILTIN_AI_API_KEY: 'server-secret-key',
                    BUILTIN_AI_MODEL: 'server-model',
                    BUILTIN_AI_ENABLED: 'true',
                    BUILTIN_AI_REQUIRE_ORIGIN: 'true',
                    BUILTIN_AI_RATE_LIMIT_KV: {
                        get: async () => null,
                        put: async () => {}
                    },
                    BUILTIN_AI_MAX_TOKENS: '2048',
                    BUILTIN_AI_MAX_INPUT_CHARS: '1000'
                }
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(forwardedRequest.url, 'https://api.deepseek.com/v1/chat/completions');
            assert.strictEqual(forwardedRequest.options.headers.get('Authorization'), 'Bearer server-secret-key');
            assert.strictEqual(forwardedRequest.options.headers.get('x-api-key'), null);
            assert.strictEqual(forwardedRequest.body.model, 'server-model');
            assert.strictEqual(forwardedRequest.body.max_tokens, 2048);
            assert.strictEqual(forwardedRequest.body.stream, true);
            assert.deepStrictEqual(forwardedRequest.body.messages, [
                { role: 'system', content: 'system prompt' },
                { role: 'user', content: 'user prompt' }
            ]);
            assert.doesNotMatch(forwardedRequest.options.body, /browser-controlled-key|browser-controlled-model/);
        } finally {
            global.fetch = originalFetch;
        }
    });

    await test('Cloudflare built-in AI reports unavailable when server secrets are missing', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://cyber-fortune.pages.dev'
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: {
                    messages: [{ role: 'user', content: 'hello' }],
                    stream: false
                }
            })
        });

        const response = await proxyModule.onRequest({ request, env: {} });
        const data = await response.json();

        assert.strictEqual(response.status, 503);
        assert.match(data.error, /内置 AI 尚未配置/);
    });

    await test('Cloudflare built-in AI requires explicit enablement and same-origin requests', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const makeRequest = (origin) => new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(origin ? { Origin: origin } : {})
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: { messages: [{ role: 'user', content: 'hello' }], stream: false }
            })
        });
        const env = {
            BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
            BUILTIN_AI_API_KEY: 'server-secret-key',
            BUILTIN_AI_MODEL: 'server-model',
            BUILTIN_AI_REQUIRE_ORIGIN: 'true'
        };

        const disabledResponse = await proxyModule.onRequest({ request: makeRequest('https://cyber-fortune.pages.dev'), env });
        assert.strictEqual(disabledResponse.status, 503);
        assert.match((await disabledResponse.json()).error, /内置 AI 尚未启用/);

        const crossOriginResponse = await proxyModule.onRequest({
            request: makeRequest('https://attacker.example'),
            env: { ...env, BUILTIN_AI_ENABLED: 'true' }
        });
        assert.strictEqual(crossOriginResponse.status, 403);
        assert.match((await crossOriginResponse.json()).error, /来源不受信任/);
    });

    await test('Cloudflare built-in AI rejects requests over the configured input limit', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://cyber-fortune.pages.dev',
                'CF-Connecting-IP': '203.0.113.11'
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: {
                    messages: [{ role: 'user', content: '123456' }],
                    stream: false
                }
            })
        });

        const response = await proxyModule.onRequest({
            request,
            env: {
                BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
                BUILTIN_AI_API_KEY: 'server-secret-key',
                BUILTIN_AI_MODEL: 'server-model',
                BUILTIN_AI_ENABLED: 'true',
                BUILTIN_AI_REQUIRE_ORIGIN: 'true',
                BUILTIN_AI_RATE_LIMIT_KV: {
                    get: async () => null,
                    put: async () => {}
                },
                BUILTIN_AI_MAX_INPUT_CHARS: '5'
            }
        });
        const data = await response.json();

        assert.strictEqual(response.status, 413);
        assert.match(data.error, /内容过长/);
    });

    await test('Cloudflare built-in AI fails closed without KV rate-limit storage and rejects exceeded clients', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://cyber-fortune.pages.dev',
                'CF-Connecting-IP': '203.0.113.12'
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: { messages: [{ role: 'user', content: 'hello' }], stream: false }
            })
        });
        const baseEnv = {
            BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
            BUILTIN_AI_API_KEY: 'server-secret-key',
            BUILTIN_AI_MODEL: 'server-model',
            BUILTIN_AI_ENABLED: 'true',
            BUILTIN_AI_REQUIRE_ORIGIN: 'true'
        };

        const missingResponse = await proxyModule.onRequest({ request: request.clone(), env: baseEnv });
        assert.strictEqual(missingResponse.status, 503);
        assert.match((await missingResponse.json()).error, /限流存储尚未配置/);

        const limitedResponse = await proxyModule.onRequest({
            request: request.clone(),
            env: {
                ...baseEnv,
                BUILTIN_AI_RATE_LIMIT_KV: {
                    get: async () => JSON.stringify({
                        count: 120,
                        windowStartedAt: Date.now(),
                        lastRequestAt: 0
                    }),
                    put: async () => {}
                }
            }
        });
        assert.strictEqual(limitedResponse.status, 429);
        assert.match((await limitedResponse.json()).error, /请求过于频繁/);
    });

    await test('Cloudflare Pages built-in AI uses a supported KV binding for rate limiting', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const originalFetch = global.fetch;
        let storedState = null;
        const makeRequest = () => new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://cyber-fortune.pages.dev',
                'CF-Connecting-IP': '203.0.113.20'
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: { messages: [{ role: 'user', content: 'hello' }], stream: false }
            })
        });
        const env = {
            BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
            BUILTIN_AI_API_KEY: 'server-secret-key',
            BUILTIN_AI_MODEL: 'server-model',
            BUILTIN_AI_ENABLED: 'true',
            BUILTIN_AI_REQUIRE_ORIGIN: 'true',
            BUILTIN_AI_RATE_LIMIT_KV: {
                get: async () => storedState,
                put: async (_key, value) => { storedState = value; }
            }
        };

        global.fetch = async () => new Response(JSON.stringify({ choices: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

        try {
            const firstResponse = await proxyModule.onRequest({ request: makeRequest(), env });
            assert.strictEqual(firstResponse.status, 200);
            assert.ok(storedState, 'rate-limit state should be persisted in KV');

            const secondResponse = await proxyModule.onRequest({ request: makeRequest(), env });
            assert.strictEqual(secondResponse.status, 429);
            assert.match((await secondResponse.json()).error, /请求过于频繁/);
            assert.doesNotMatch(source, /BUILTIN_AI_RATE_LIMITER/);
        } finally {
            global.fetch = originalFetch;
        }
    });

    await test('Cloudflare built-in AI defaults support long reports and normal repeated use', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const originalFetch = global.fetch;
        let forwardedBody = null;
        const now = Date.now();
        const request = new Request('https://cyber-fortune.pages.dev/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://cyber-fortune.pages.dev',
                'CF-Connecting-IP': '203.0.113.21'
            },
            body: JSON.stringify({
                mode: 'builtin',
                body: {
                    messages: [{ role: 'user', content: '长报告上下文'.repeat(12500) }],
                    max_tokens: 99999,
                    stream: false
                }
            })
        });
        const env = {
            BUILTIN_AI_API_URL: 'https://api.deepseek.com/v1/chat/completions',
            BUILTIN_AI_API_KEY: 'server-secret-key',
            BUILTIN_AI_MODEL: 'server-model',
            BUILTIN_AI_ENABLED: 'true',
            BUILTIN_AI_REQUIRE_ORIGIN: 'true',
            BUILTIN_AI_RATE_LIMIT_KV: {
                get: async () => JSON.stringify({
                    count: 20,
                    windowStartedAt: now,
                    lastRequestAt: now - 1500
                }),
                put: async () => {}
            }
        };

        global.fetch = async (_url, options) => {
            forwardedBody = JSON.parse(options.body);
            return new Response(JSON.stringify({ choices: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        try {
            const response = await proxyModule.onRequest({ request, env });
            assert.strictEqual(response.status, 200);
            assert.strictEqual(forwardedBody.max_tokens, 12800);
        } finally {
            global.fetch = originalFetch;
        }
    });

    await test('Cloudflare deployment docs use the correct repository and Wrangler for Functions', () => {
        const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
        assert.match(readme, /xiaolong2438\/cyber-fortune/);
        assert.doesNotMatch(readme, /longxingdeng\/cyber-fortune/);
        assert.match(readme, /wrangler pages deploy/);
        assert.doesNotMatch(readme, /Upload assets/);
    });

    await test('Cloudflare proxy accepts public HTTPS API domains without a manual allowlist', async () => {
        const source = fs.readFileSync(path.join(projectRoot, 'functions/api/proxy.js'), 'utf8');
        const proxyModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        const originalFetch = global.fetch;
        let forwardedUrl = '';
        global.fetch = async (url) => {
            forwardedUrl = String(url);
            return new Response(JSON.stringify({ data: [{ id: 'custom-model' }] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        const makeRequest = (targetUrl) => new Request('https://fortune.example/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl, method: 'GET', headers: { Authorization: 'Bearer test-key' } })
        });

        try {
            const publicResponse = await proxyModule.onRequest({
                request: makeRequest('https://llm.example.com/v1/models'),
                env: {}
            });
            assert.strictEqual(publicResponse.status, 200);
            assert.strictEqual(forwardedUrl, 'https://llm.example.com/v1/models');
            assert.doesNotMatch(source, /ALLOWED_API_HOSTS/);

            for (const privateUrl of [
                'https://localhost/v1/models',
                'https://127.0.0.1/v1/models',
                'https://10.0.0.8/v1/models',
                'https://metadata.internal/v1/models',
                'https://service.test/v1/models'
            ]) {
                const response = await proxyModule.onRequest({ request: makeRequest(privateUrl), env: {} });
                assert.strictEqual(response.status, 403);
            }
        } finally {
            global.fetch = originalFetch;
        }
    });

    await test('Legacy workers proxy entry is removed so it cannot bypass Pages Function checks', () => {
        assert.strictEqual(fs.existsSync(path.join(projectRoot, 'workers/api-proxy.js')), false);
    });

    if (failures.length > 0) {
        console.error(`\n${failures.length} API routing test(s) failed.`);
        process.exit(1);
    }

    console.log('\nAll API routing tests passed.');
})();

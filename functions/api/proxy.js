const CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
};

const FORWARDED_HEADERS = new Set([
    'authorization',
    'content-type',
    'x-api-key',
    'anthropic-version'
]);

function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}

function isPrivateOrLocalHost(hostname) {
    const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
    if (host.includes(':')) return true; // Reject literal IPv6 targets; DNS hostnames remain supported.

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a >= 224;
}

function isSafePublicTarget(targetUrl) {
    if (targetUrl.username || targetUrl.password || isPrivateOrLocalHost(targetUrl.hostname)) return false;
    const hostname = targetUrl.hostname.toLowerCase();
    return hostname !== 'internal' &&
        !hostname.endsWith('.internal') &&
        !hostname.endsWith('.intranet') &&
        !hostname.endsWith('.home.arpa') &&
        !hostname.endsWith('.test') &&
        !hostname.endsWith('.invalid');
}

function positiveInteger(value, fallback, maximum) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, maximum);
}

function getBuiltinConfig(env) {
    const apiUrl = String(env.BUILTIN_AI_API_URL || '').trim();
    const apiKey = String(env.BUILTIN_AI_API_KEY || '').trim();
    const model = String(env.BUILTIN_AI_MODEL || '').trim();
    if (!apiUrl || !apiKey || !model) return null;

    let targetUrl;
    try {
        targetUrl = new URL(apiUrl);
    } catch (error) {
        return null;
    }

    if (targetUrl.protocol !== 'https:' || !isSafePublicTarget(targetUrl)) return null;

    return {
        targetUrl,
        apiKey,
        model,
        maxTokens: positiveInteger(env.BUILTIN_AI_MAX_TOKENS, 12800, 16000),
        maxInputChars: positiveInteger(env.BUILTIN_AI_MAX_INPUT_CHARS, 120000, 200000)
    };
}

function buildBuiltinBody(inputBody, config) {
    const messages = Array.isArray(inputBody?.messages)
        ? inputBody.messages
            .filter(message => ['system', 'user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
            .slice(0, 20)
            .map(message => ({ role: message.role, content: message.content }))
        : [];

    if (!messages.length) {
        return { error: jsonResponse({ error: '内置 AI 请求缺少有效消息' }, 400) };
    }

    const inputChars = messages.reduce((total, message) => total + message.content.length, 0);
    if (inputChars > config.maxInputChars) {
        return { error: jsonResponse({ error: '内置 AI 请求内容过长' }, 413) };
    }

    const requestedMaxTokens = positiveInteger(inputBody?.max_tokens, config.maxTokens, config.maxTokens);
    const requestedTemperature = Number(inputBody?.temperature);
    const body = {
        model: config.model,
        messages,
        stream: Boolean(inputBody?.stream),
        temperature: Number.isFinite(requestedTemperature)
            ? Math.max(0, Math.min(2, requestedTemperature))
            : 0.6,
        max_tokens: requestedMaxTokens
    };

    if (['low', 'medium', 'high'].includes(inputBody?.reasoning_effort)) {
        body.reasoning_effort = inputBody.reasoning_effort;
    }

    return { body };
}

async function getRateLimitKey(clientKey) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientKey));
    return `builtin-ai:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function enforceBuiltinRateLimit(env, clientKey) {
    const store = env.BUILTIN_AI_RATE_LIMIT_KV;
    if (!store || typeof store.get !== 'function' || typeof store.put !== 'function') {
        return jsonResponse({ error: '站点内置 AI 限流存储尚未配置，请联系管理员或使用个人 API' }, 503);
    }

    const windowSeconds = Math.max(60, positiveInteger(env.BUILTIN_AI_RATE_WINDOW_SECONDS, 3600, 86400));
    const maxRequests = positiveInteger(env.BUILTIN_AI_RATE_MAX_REQUESTS, 120, 1000);
    const minIntervalMs = positiveInteger(env.BUILTIN_AI_MIN_INTERVAL_SECONDS, 1, 300) * 1000;
    const now = Date.now();

    try {
        const key = await getRateLimitKey(clientKey);
        const stored = await store.get(key);
        let state = stored ? JSON.parse(stored) : null;
        if (!state || !Number.isFinite(state.windowStartedAt) || now - state.windowStartedAt >= windowSeconds * 1000) {
            state = { count: 0, windowStartedAt: now, lastRequestAt: 0 };
        }

        if (state.count >= maxRequests || (state.lastRequestAt && now - state.lastRequestAt < minIntervalMs)) {
            return jsonResponse({ error: '内置 AI 请求过于频繁，请稍后再试或使用个人 API' }, 429);
        }

        state.count += 1;
        state.lastRequestAt = now;
        await store.put(key, JSON.stringify(state), { expirationTtl: windowSeconds });
        return null;
    } catch (error) {
        console.error('内置 AI 限流检查失败:', error instanceof Error ? error.message : String(error));
        return jsonResponse({ error: '站点内置 AI 限流服务暂时不可用，请稍后再试或使用个人 API' }, 503);
    }
}

async function forwardBuiltinRequest(payload, env, request) {
    const config = getBuiltinConfig(env);
    if (!config) {
        return jsonResponse({ error: '站点内置 AI 尚未配置，请联系管理员或使用个人 API' }, 503);
    }

    if (String(env.BUILTIN_AI_ENABLED || '').toLowerCase() !== 'true') {
        return jsonResponse({ error: '站点内置 AI 尚未启用，请联系管理员或使用个人 API' }, 503);
    }

    if (String(env.BUILTIN_AI_REQUIRE_ORIGIN || 'true').toLowerCase() !== 'false') {
        const requestOrigin = request.headers.get('Origin');
        const allowedOrigin = String(env.BUILTIN_AI_ALLOWED_ORIGIN || new URL(request.url).origin).replace(/\/$/, '');
        if (!requestOrigin || requestOrigin.replace(/\/$/, '') !== allowedOrigin) {
            return jsonResponse({ error: '内置 AI 请求来源不受信任' }, 403);
        }
    }

    const clientKey = request.headers.get('CF-Connecting-IP');
    if (!clientKey) {
        return jsonResponse({ error: '无法识别内置 AI 请求来源' }, 403);
    }

    const rateLimitError = await enforceBuiltinRateLimit(env, clientKey);
    if (rateLimitError) return rateLimitError;

    const normalized = buildBuiltinBody(payload.body, config);
    if (normalized.error) return normalized.error;

    const headers = new Headers({
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
    });
    const upstreamResponse = await fetch(config.targetUrl.toString(), {
        method: 'POST',
        headers,
        redirect: 'manual',
        body: JSON.stringify(normalized.body)
    });

    if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
        return jsonResponse({ error: '内置 AI 上游重定向已被拒绝' }, 502);
    }

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}

export async function onRequest({ request, env = {} }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    try {
        const payload = await request.json();

        if (payload.mode === 'builtin') {
            return await forwardBuiltinRequest(payload, env, request);
        }

        const targetUrl = new URL(payload.targetUrl);
        const method = String(payload.method || 'GET').toUpperCase();

        if (targetUrl.protocol !== 'https:') {
            return jsonResponse({ error: '仅允许 HTTPS API 地址' }, 400);
        }

        if (!isSafePublicTarget(targetUrl)) {
            return jsonResponse({ error: 'API 地址必须使用 HTTPS，且不能指向本机、私网或内部域名' }, 403);
        }

        if (!['GET', 'POST'].includes(method)) {
            return jsonResponse({ error: '仅允许 GET 或 POST 请求' }, 400);
        }

        const headers = new Headers();
        for (const [name, value] of Object.entries(payload.headers || {})) {
            if (FORWARDED_HEADERS.has(name.toLowerCase())) {
                headers.set(name, String(value));
            }
        }

        const upstreamResponse = await fetch(targetUrl.toString(), {
            method,
            headers,
            redirect: 'manual',
            body: method === 'POST' && payload.body !== undefined
                ? JSON.stringify(payload.body)
                : undefined
        });

        if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
            return jsonResponse({ error: '上游重定向已被拒绝' }, 502);
        }

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: {
                ...CORS_HEADERS,
                'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        return jsonResponse({ error: '代理请求失败', message: error.message }, 500);
    }
}

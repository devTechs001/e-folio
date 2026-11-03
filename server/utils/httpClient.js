'use strict';
/**
 * Minimal axios-compatible HTTP client built on Node's native fetch.
 *
 * server/package.json never declared `axios`; it only appeared as an
 * auto-installed peer of axios-retry, which made every deployment depend on
 * pnpm's peer-resolution behaviour. This module implements the small subset
 * the server actually uses (get/post/put/delete with headers, params, timeout)
 * and throws axios-shaped errors on non-2xx responses.
 */

function buildUrl(url, params) {
    if (!params || typeof params !== 'object') return url;
    const parsed = new URL(url);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) parsed.searchParams.set(key, String(value));
    }
    return parsed.toString();
}

async function request(method, url, body, config = {}) {
    const target = buildUrl(url, config.params);
    const headers = { ...(config.headers || {}) };
    if (body !== undefined && !Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...(config.timeout ? { signal: AbortSignal.timeout(config.timeout) } : {})
    };

    const response = await fetch(target, options);
    const text = await response.text();
    let data = text;
    if (text) {
        try { data = JSON.parse(text); } catch { /* keep plain text (e.g. Markdown) */ }
    }

    const result = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    };

    if (!response.ok) {
        const error = new Error(`Request failed with status code ${response.status}`);
        error.response = result;
        error.config = { url: target, method };
        throw error;
    }
    return result;
}

module.exports = {
    get: (url, config) => request('GET', url, undefined, config),
    post: (url, body, config) => request('POST', url, body, config),
    put: (url, body, config) => request('PUT', url, body, config),
    patch: (url, body, config) => request('PATCH', url, body, config),
    delete: (url, config) => request('DELETE', url, undefined, config),
    request
};

/**
 * Client-side hardening helpers (confidential).
 *
 * Previous version ran two permanent intervals (500 ms devtools probing and a
 * 1 s console.clear loop), blocked right-click and F12, and called a
 * `/api/validate-license` endpoint that does not exist. None of that protects a
 * web app — client code is fully under the visitor's control — but the timers
 * did keep the main thread busy on every page and caused visible jank.
 *
 * Real protection lives on the server (JWT verification, rate limits, input
 * validation, CORS). This module now only applies non-intrusive browser
 * defaults and keeps a small, explicit API for the app shell.
 */

/** Apply browser-level defaults that genuinely reduce data leakage. */
export function setupSecurity() {
    if (typeof document === 'undefined') return;

    if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'strict-origin-when-cross-origin';
        document.head.appendChild(meta);
    }

    // Do not expose the opener window to links opened in a new tab.
    if (typeof window !== 'undefined') {
        document.addEventListener('click', (event) => {
            const anchor = event.target?.closest?.('a[target="_blank"]');
            if (anchor && !anchor.relList.contains('noopener')) {
                anchor.rel = 'noopener noreferrer';
            }
        }, { passive: true });
    }
}

/** Optional subtle watermark; kept for callers that still want it. */
export function addWatermark() {
    if (typeof document === 'undefined' || import.meta.env?.MODE !== 'production') return;
    if (document.getElementById('efolio-watermark')) return;

    const watermark = document.createElement('div');
    watermark.id = 'efolio-watermark';
    watermark.textContent = 'E-Folio Pro ©';
    Object.assign(watermark.style, {
        position: 'fixed', bottom: '10px', right: '10px', opacity: '0.3',
        fontSize: '12px', zIndex: '9999', pointerEvents: 'none', color: '#666'
    });
    document.body.appendChild(watermark);
}

/**
 * Phase 39 — sanitise HTML before it is handed to `dangerouslySetInnerHTML`.
 *
 * The two legal pages render static, in-repo copy today, so this is defence in
 * depth rather than an active breach: if that copy ever moves to the CMS, the
 * render path is already safe. Allow-list based — anything not named here is
 * dropped, and every URL-bearing attribute is scheme-checked so `javascript:`
 * and `data:` payloads cannot survive.
 */
const ALLOWED_TAGS = new Set([
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'small',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'q', 'cite', 'code', 'pre',
    'a', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'div', 'section', 'article', 'figure', 'figcaption'
]);

const ALLOWED_ATTRS = new Set([
    'href', 'title', 'target', 'rel', 'class', 'id',
    'colspan', 'rowspan', 'scope', 'datetime', 'lang', 'dir'
]);

const SAFE_URL = /^(?:https?:\/\/|mailto:|tel:|\/|#|\.{0,2}\/)/i;

// C0 control characters are used to smuggle `java\nscript:` past naive checks.
const CONTROL_CHARS = /[\x00-\x1F\x7F]/; // eslint-disable-line no-control-regex

function safeUrl(value) {
    const trimmed = String(value || '').trim();
    if (CONTROL_CHARS.test(trimmed)) return '';
    if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) return '';
    return SAFE_URL.test(trimmed) ? trimmed : '';
}

/** Remove every script-capable node from an HTML string. Browser-only. */
export function sanitizeHtml(html) {
    const source = String(html ?? '');
    if (!source) return '';
    if (typeof document === 'undefined') {
        // No DOM (SSR/tests): fall back to stripping the dangerous constructs
        // outright rather than returning unvetted markup.
        // Unwrap or drop anything that is not on the allow list, then remove
        // inline handlers and unsafe URL schemes. Order matters: the handlers
        // go before the URL pass so a handler cannot hide a scheme.
        return source
            // Paired dangerous blocks go first, so their opening tag is still
            // there for the back-reference to match.
            .replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?<\/\1\s*>/gi, '')
            // Void/self-closing dangerous elements are dropped outright.
            .replace(/<(script|style|iframe|object|embed|form|input|button|link|meta|base|img|svg|math|video|audio|source|track|canvas|frame|frameset|applet)\b[^>]*\/?>/gi, '')
            // An unclosed block swallows the rest of the string rather than
            // being kept as text.
            .replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*$/gi, '')
            .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/(?:href|src|action|formaction)\s*=\s*(?:"|')?\s*(?:javascript|data|vbscript|file):[^"'>\s]*(?:"|')?/gi, '')
            // Strip attributes that are not on the allow list, keeping tags.
            .replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag, attrs) => {
                const kept = attrs.replace(
                    /([a-zA-Z-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g,
                    (attrMatch, name) => (ALLOWED_ATTRS.has(name.toLowerCase()) ? attrMatch : '')
                );
                return `<${tag}${kept}>`;
            });
    }

    const template = document.createElement('template');
    template.innerHTML = source;

    const walk = node => {
        for (const child of [...node.children]) {
            if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
                // Keep the text, drop the element: unwrap instead of deleting so
                // a stray <font> or <center> does not swallow its content.
                child.replaceWith(...child.childNodes);
                continue;
            }
            for (const attr of [...child.attributes]) {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
                    child.removeAttribute(attr.name);
                    continue;
                }
                if (name === 'href' && !safeUrl(attr.value)) {
                    child.removeAttribute('href');
                }
            }
            if (child.tagName.toLowerCase() === 'a') {
                child.setAttribute('rel', 'noopener noreferrer');
            }
            walk(child);
        }
    };
    walk(template.content);
    return template.innerHTML;
}

/**
 * Phase 39 — production builds must not ship developer switches.
 *
 * Any `?debug`, `?dev`, `?internal` or `?test` flag is dropped from the URL on
 * a production build so it can never be forwarded to an API or used as a
 * feature switch, and a small allow-list of debug globals stops being written.
 * Development keeps its tooling untouched.
 */
export const DEV_ONLY_PARAMS = ['debug', 'dev', 'developer', 'internal', 'test', 'trace'];

export function isProductionBuild() {
    try {
        return Boolean(import.meta.env?.PROD);
    } catch {
        return true; // fail closed when the flag is unavailable
    }
}

/** Strip developer query parameters in production. Returns the removed keys. */
export function stripDevParams() {
    if (typeof window === 'undefined' || !isProductionBuild()) return [];
    let url;
    try {
        url = new URL(window.location.href);
    } catch {
        return [];
    }
    const removed = [];
    for (const key of DEV_ONLY_PARAMS) {
        if (url.searchParams.has(key)) {
            url.searchParams.delete(key);
            removed.push(key);
        }
    }
    if (removed.length) {
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    return removed;
}

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

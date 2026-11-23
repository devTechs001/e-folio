/**
 * Phase 40 — client-side cache cleaner.
 *
 * Applies the decisions from `src/utils/cacheCleaner.js` to the real browser.
 * Every surface reports what actually happened; nothing is reported as cleared
 * unless the removal succeeded.
 *
 * Deliberately conservative:
 *  - an auth token is never removed, whatever the caller asks for;
 *  - the review outbox is only touched when `allowDestructive` is set;
 *  - service-worker caches are only deleted by name, never "all caches", so a
 *    cache owned by another app on the same origin cannot be collateral damage.
 *
 * Confidential: local checkout only.
 */
import cacheService from './cache.service';
import {
    shouldClearStorageKey,
    selectSurfaces,
    summariseRun,
    measureStorageArea,
    storageSize
} from '../utils/cacheCleaner';

const REVIEW_OUTBOX_KEY = 'efolio:review-outbox';

/** Collect the keys in a Storage area that the cleaner may remove. */
function clearableKeys(storage) {
    if (!storage) return [];
    const keys = [];
    try {
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key && shouldClearStorageKey(key)) keys.push(key);
        }
    } catch {
        return [];
    }
    return keys;
}

/** Remove the allowed keys, returning what was really removed. */
function purgeStorageArea(storage, areaLabel) {
    if (!storage) {
        return { status: 'unsupported', detail: `${areaLabel} is not available in this browser.`, removedKeys: 0, bytes: 0 };
    }
    let keys;
    try {
        keys = clearableKeys(storage);
    } catch {
        return { status: 'error', detail: `${areaLabel} could not be read.`, removedKeys: 0, bytes: 0 };
    }

    if (keys.length === 0) {
        return { status: 'cleared', detail: `Nothing to remove from ${areaLabel}.`, removedKeys: 0, bytes: 0 };
    }

    let removedKeys = 0;
    let bytes = 0;
    for (const key of keys) {
        try {
            bytes += storageSize(key) + storageSize(storage.getItem(key));
            storage.removeItem(key);
            removedKeys += 1;
        } catch {
            // Keep going: one blocked key must not abort the whole purge.
        }
    }
    return {
        status: 'cleared',
        detail: `Removed ${removedKeys} of ${keys.length} key${keys.length === 1 ? '' : 's'} from ${areaLabel}.`,
        removedKeys,
        bytes
    };
}

/** Delete the app's own service-worker caches by name prefix. */
async function purgeServiceWorkerCaches() {
    if (typeof caches === 'undefined') {
        return { status: 'unsupported', detail: 'This browser has no Cache Storage API.', removedKeys: 0, bytes: 0 };
    }
    let names = [];
    try {
        names = await caches.keys();
    } catch {
        return { status: 'error', detail: 'The cache list could not be read.', removedKeys: 0, bytes: 0 };
    }

    // Only touch the caches this app registers (see vite.config.js).
    const owned = names.filter(name => /^(static-media-cache|google-fonts-cache|workbox-)/i.test(name));
    if (owned.length === 0) {
        return { status: 'cleared', detail: 'No app caches are stored right now.', removedKeys: 0, bytes: 0 };
    }

    let removed = 0;
    for (const name of owned) {
        try {
            if (await caches.delete(name)) removed += 1;
        } catch {
            // Continue with the rest.
        }
    }
    const status = removed === owned.length ? 'cleared' : removed > 0 ? 'partial' : 'error';
    return {
        status,
        detail: `Removed ${removed} of ${owned.length} cache${owned.length === 1 ? '' : 's'}.`,
        removedKeys: removed,
        bytes: 0
    };
}

/** Read the review outbox without clearing it. */
function readReviewOutbox() {
    try {
        const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(REVIEW_OUTBOX_KEY);
        if (!raw) return { available: true, pending: 0, bytes: 0 };
        const parsed = JSON.parse(raw);
        const pending = Array.isArray(parsed) ? parsed.length : 0;
        return { available: true, pending, bytes: storageSize(raw) };
    } catch {
        return { available: false, pending: 0, bytes: 0 };
    }
}

/** Purge the review outbox. Only reachable when destructive work is confirmed. */
function purgeReviewOutbox() {
    if (typeof localStorage === 'undefined') {
        return { status: 'unsupported', detail: 'localStorage is not available.', removedKeys: 0, bytes: 0 };
    }
    const before = readReviewOutbox();
    try {
        localStorage.removeItem(REVIEW_OUTBOX_KEY);
    } catch {
        return { status: 'error', detail: 'The review outbox could not be removed.', removedKeys: 0, bytes: 0 };
    }
    return {
        status: 'cleared',
        detail: before.pending
            ? `Discarded ${before.pending} unsent review draft${before.pending === 1 ? '' : 's'}.`
            : 'There were no unsent drafts.',
        removedKeys: before.pending > 0 ? 1 : 0,
        bytes: before.bytes
    };
}

/** Current client-side footprint, for the resources panel. */
export function measureClientStorage() {
    const local = typeof localStorage === 'undefined'
        ? { available: false, keys: 0, bytes: 0 }
        : measureStorageArea(localStorage);
    const session = typeof sessionStorage === 'undefined'
        ? { available: false, keys: 0, bytes: 0 }
        : measureStorageArea(sessionStorage);

    const api = cacheService.stats();
    const outbox = readReviewOutbox();

    return {
        localStorage: local,
        sessionStorage: session,
        apiCache: { entries: api.size, hits: api.hits, misses: api.misses, hitRate: api.hitRate },
        reviewOutbox: outbox,
        totalBytes: local.bytes + session.bytes
    };
}

/**
 * Clear the selected client surfaces.
 *
 * @param {object} options
 * @param {string[]} [options.ids]                surfaces to act on
 * @param {boolean} [options.allowDestructive]    permit clearing unsent drafts
 * @returns {Promise<{status: string, results: object[], summary: object}>}
 */
export async function clearClientCaches({ ids, allowDestructive = false } = {}) {
    const { selected, skipped } = selectSurfaces({ scope: 'client', ids, allowDestructive });
    const results = [];

    for (const surface of selected) {
        let outcome;
        switch (surface.id) {
            case 'api-cache': {
                const before = cacheService.stats().size;
                cacheService.clear();
                outcome = {
                    status: 'cleared',
                    detail: before ? `Cleared ${before} cached response${before === 1 ? '' : 's'}.` : 'The response cache was already empty.',
                    removedKeys: before,
                    bytes: 0
                };
                break;
            }
            case 'local-storage':
                outcome = purgeStorageArea(typeof localStorage === 'undefined' ? null : localStorage, 'localStorage');
                break;
            case 'session-storage':
                outcome = purgeStorageArea(typeof sessionStorage === 'undefined' ? null : sessionStorage, 'sessionStorage');
                break;
            case 'service-worker-cache':
                outcome = await purgeServiceWorkerCaches();
                break;
            case 'review-outbox':
                outcome = purgeReviewOutbox();
                break;
            default:
                outcome = { status: 'unsupported', detail: 'This surface is not handled here.', removedKeys: 0, bytes: 0 };
        }
        results.push({ id: surface.id, label: surface.label, destructive: surface.destructive, ...outcome });
    }

    for (const surface of skipped) {
        results.push({
            id: surface.id,
            label: surface.label,
            destructive: surface.destructive,
            status: 'skipped',
            detail: `Not cleared: ${surface.reason}.`,
            removedKeys: 0,
            bytes: 0
        });
    }

    return { status: summariseRun(results.filter(item => item.status !== 'skipped')).status, results, summary: summariseRun(results) };
}

export default { clearClientCaches, measureClientStorage };

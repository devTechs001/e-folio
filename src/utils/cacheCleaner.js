/**
 * Phase 40 — shared cache-cleaner logic.
 *
 * Every purge decision lives here so the browser tool and the owner-only server
 * endpoint behave identically and can be tested without a browser or a database.
 * Nothing in this file invents data: it only *selects* what to remove, and
 * reports what it actually removed.
 *
 * Confidential: local checkout only.
 */

/**
 * Cache surfaces the cleaner knows about.
 *
 * `scope: 'client'` entries live in the visitor's own browser and are safe for a
 * signed-in user to purge. `scope: 'server'` entries live in process memory on
 * the API host and are owner-only.
 *
 * `destructive` marks a surface that removes *user data* rather than a
 * disposable copy: clearing the review outbox can drop submissions that have not
 * reached the server yet. Those require an explicit confirmation flag.
 */
export const CACHE_SURFACES = [
    {
        id: 'api-cache',
        label: 'API response cache',
        scope: 'client',
        description: 'In-memory copies of public section responses, cleared freely.',
        destructive: false
    },
    {
        id: 'local-storage',
        label: 'Saved browser state',
        scope: 'client',
        description: 'Theme, filters and cached section copies kept in localStorage.',
        destructive: false
    },
    {
        id: 'session-storage',
        label: 'Scroll and session hints',
        scope: 'client',
        description: 'Short-lived view state kept in sessionStorage.',
        destructive: false
    },
    {
        id: 'service-worker-cache',
        label: 'Offline app shell',
        scope: 'client',
        description: 'The precached PWA shell and runtime asset copies.',
        destructive: false
    },
    {
        id: 'review-outbox',
        label: 'Unsent review drafts',
        scope: 'client',
        description: 'Reviews queued offline that have not reached the server yet.',
        destructive: true
    },
    {
        id: 'server-cache',
        label: 'Server response cache',
        scope: 'server',
        description: 'Process-memory caches on the API host (resource inventory, audit).',
        destructive: false
    }
];

/** Prefixes used by app code for localStorage keys we are allowed to drop. */
export const CLEARABLE_STORAGE_PREFIXES = [
    'efolio:',
    'cache:',
    'publicSection:',
    'dashboard:'
];

/**
 * Prefixes that must survive a purge.
 *
 * Dropping these signs the user out or destroys a draft they were editing, which
 * is not what "clear cache" means. They are checked *before* the clearable
 * prefixes, so an explicitly protected key always wins.
 */
export const PROTECTED_STORAGE_KEYS = [
    'token',
    'efolio_token',
    'authToken',
    'refreshToken',
    'efolio:token',
    'cv:draft',
    'efolio:cv-draft'
];

export const PROTECTED_STORAGE_PREFIXES = [
    'token',
    'efolio:token',
    'auth',
    'cv:draft',
    'cvDraft'
];

/** Decide whether a storage key may be removed. */
export function shouldClearStorageKey(key) {
    if (typeof key !== 'string' || !key) return false;

    const lower = key.toLowerCase();
    if (PROTECTED_STORAGE_KEYS.some(protectedKey => protectedKey.toLowerCase() === lower)) {
        return false;
    }
    if (PROTECTED_STORAGE_PREFIXES.some(prefix => lower.startsWith(prefix.toLowerCase()))) {
        return false;
    }
    return CLEARABLE_STORAGE_PREFIXES.some(prefix => lower.startsWith(prefix.toLowerCase()));
}

/**
 * Pick the surfaces a purge will act on.
 *
 * @param {object} options
 * @param {'client'|'server'} options.scope
 * @param {string[]} [options.ids]       restrict to these surface ids
 * @param {boolean} [options.allowDestructive]
 * @returns {{ selected: object[], skipped: object[] }}
 */
export function selectSurfaces({ scope, ids, allowDestructive = false } = {}) {
    const wanted = Array.isArray(ids) && ids.length ? new Set(ids) : null;
    const selected = [];
    const skipped = [];

    for (const surface of CACHE_SURFACES) {
        if (surface.scope !== scope) continue;
        if (wanted && !wanted.has(surface.id)) continue;
        if (surface.destructive && !allowDestructive) {
            skipped.push({ ...surface, reason: 'requires explicit confirmation' });
            continue;
        }
        selected.push(surface);
    }
    return { selected, skipped };
}

/**
 * Turn per-surface results into a verdict.
 *
 * A surface with `status: 'error'` makes the whole run `failed`; anything else
 * that could not be cleared makes it `partial`. Never reports success for work
 * that did not happen.
 */
export function summariseRun(results) {
    const list = Array.isArray(results) ? results.filter(Boolean) : [];
    if (!list.length) {
        return { status: 'empty', cleared: 0, total: 0, errors: 0 };
    }
    const errors = list.filter(item => item.status === 'error').length;
    const unsupported = list.filter(item => item.status === 'unsupported').length;
    const cleared = list.filter(item => item.status === 'cleared').length;

    let status = 'cleared';
    if (errors > 0) status = 'failed';
    else if (unsupported > 0 || cleared < list.length) status = 'partial';

    return { status, cleared, total: list.length, errors, unsupported };
}

/**
 * Human-readable byte count. Returns '—' for values that are not counts, so a
 * missing measurement never renders as "0 B".
 */
export function formatBytes(value) {
    // Number(null) and Number('') are 0, which would print a confident "0 B"
    // for a value we never actually measured. Reject them before coercing.
    if (value == null || value === '' || typeof value === 'boolean') return '—';
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Approximate the size of a stored value in bytes.
 * Uses the UTF-16 string length, which is what the browser actually holds.
 */
export function storageSize(value) {
    if (value == null) return 0;
    const text = typeof value === 'string' ? value : String(value);
    return text.length * 2;
}

/**
 * Rough browser-storage usage by category, from a Storage-like object.
 * Returns `null` per category when the API is unavailable, so the UI can say
 * "not measurable" rather than showing a false zero.
 */
export function measureStorageArea(storage) {
    if (!storage) return { available: false, keys: 0, bytes: 0 };
    try {
        let bytes = 0;
        let keys = 0;
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key == null) continue;
            keys += 1;
            bytes += storageSize(key) + storageSize(storage.getItem(key));
        }
        return { available: true, keys, bytes };
    } catch {
        // Access can throw in private mode or when storage is blocked.
        return { available: false, keys: 0, bytes: 0 };
    }
}

/**
 * Alert thresholds, evaluated against measurements that actually exist.
 *
 * Each rule returns `null` when it cannot be evaluated, so a missing metric
 * never raises a false alarm. Severity is 'critical' | 'warning' | 'info'.
 */
export const ALERT_RULES = [
    {
        id: 'memory-high',
        metric: 'memoryUsagePercent',
        severity: 'critical',
        threshold: 90,
        title: 'Server memory critically high',
        detail: value => `${value.toFixed(1)}% of system memory is in use.`
    },
    {
        id: 'memory-elevated',
        metric: 'memoryUsagePercent',
        severity: 'warning',
        threshold: 75,
        // Below the critical rule's threshold: one condition, one alert.
        below: 90,
        title: 'Server memory elevated',
        detail: value => `${value.toFixed(1)}% of system memory is in use.`
    },
    {
        id: 'heap-pressure',
        metric: 'heapUsagePercent',
        severity: 'warning',
        threshold: 85,
        title: 'Node heap pressure',
        detail: value => `${value.toFixed(1)}% of the V8 heap limit is allocated.`
    },
    {
        id: 'database-down',
        metric: 'databaseConnected',
        // Boolean rules compare against `threshold` as the UNHEALTHY value.
        severity: 'critical',
        threshold: false,
        title: 'Database disconnected',
        detail: () => 'The API cannot reach MongoDB. Writes will fail until it reconnects.'
    },
    {
        id: 'browser-storage-heavy',
        metric: 'browserStorageBytes',
        severity: 'warning',
        threshold: 4 * 1024 * 1024,
        title: 'Browser storage is large',
        detail: value => `${formatBytes(value)} of app data is stored in this browser.`
    },
    {
        id: 'cache-stale',
        metric: 'cacheEntries',
        severity: 'info',
        threshold: 200,
        title: 'Response cache is busy',
        detail: value => `${value} cached responses are held in memory.`
    }
];

/**
 * Evaluate the alert rules against a metrics object.
 * Unknown metrics are skipped; known-but-unhealthy ones produce alerts.
 */
export function evaluateAlerts(metrics = {}) {
    const alerts = [];
    for (const rule of ALERT_RULES) {
        const value = metrics[rule.metric];
        if (value == null) continue;

        if (typeof value === 'boolean') {
            // A boolean rule declares the value that is *unhealthy*
            // (databaseConnected: false means the database is down).
            if (value !== rule.threshold) continue; // healthy
            alerts.push({
                id: rule.id,
                severity: rule.severity,
                title: rule.title,
                detail: rule.detail(value),
                metric: rule.metric,
                value
            });
            continue;
        }

        const numeric = Number(value);
        if (!Number.isFinite(numeric)) continue;
        // Numeric rules fire at or above their threshold. An optional `below`
        // bound keeps a milder rule from double-reporting a critical one.
        if (rule.below != null && numeric >= rule.below) continue;
        if (numeric >= rule.threshold) {
            alerts.push({
                id: rule.id,
                severity: rule.severity,
                title: rule.title,
                detail: rule.detail(numeric),
                metric: rule.metric,
                value: numeric
            });
        }
    }

    const rank = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
}

/** Overall status chip for a set of alerts. */
export function alertStatus(alerts = []) {
    if (!Array.isArray(alerts) || alerts.length === 0) {
        return { level: 'healthy', label: 'All clear' };
    }
    if (alerts.some(alert => alert.severity === 'critical')) {
        return { level: 'critical', label: `${alerts.length} alert${alerts.length === 1 ? '' : 's'}` };
    }
    if (alerts.some(alert => alert.severity === 'warning')) {
        return { level: 'warning', label: `${alerts.length} warning${alerts.length === 1 ? '' : 's'}` };
    }
    return { level: 'info', label: `${alerts.length} notice${alerts.length === 1 ? '' : 's'}` };
}

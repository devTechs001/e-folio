/**
 * Phase 41 — shared Projects ↔ Lab classification.
 *
 * Why this exists
 * ---------------
 * The Projects page and the Lab page were both deriving "is this a lab
 * experiment?" independently, and they disagreed:
 *
 *   - Projects published portfolio records with `status: 'live'` / `'beta'`
 *     (Portfolio Website, Task Management App, …).
 *   - The Lab treated *any* record with status live/beta/development/experimental
 *     as an experiment, so those five portfolio projects also appeared in the
 *     Lab — making the two systems look like they conflicted.
 *   - The Lab's dedupe was title-only, so once a live record and a saved
 *     experiment happened to differ in title (or a rebuild changed the snapshot),
 *     the same work could appear twice.
 *
 * The fix is one shared rule, used by both pages, plus a stable identity that
 * does not depend on the title being stable.
 *
 * Confidential: local checkout only.
 */

/** Statuses the Lab may display. */
export const LAB_STATUSES = Object.freeze(['live', 'beta', 'development', 'experimental']);

/**
 * Statuses that belong to the PROJECTS grid.
 *
 * A record is a portfolio piece when it is finished enough to publish. `live`
 * and `beta` appear in both lists, which is exactly why status alone cannot
 * decide the home of a record — see `isLabExperiment` below.
 */
export const PORTFOLIO_STATUSES = Object.freeze(['completed', 'live', 'beta']);

/** Explicit opt-in marker: a record created from the Lab dashboard. */
export const LAB_MARKER = 'lab';

/**
 * Normalise a record's status for comparison.
 * @returns {string} lower-case status, or '' when absent
 */
export function normaliseStatus(record) {
    return String(record?.status ?? '').trim().toLowerCase();
}

/**
 * Stable identity for a project record.
 *
 * Prefers the record id; falls back to the slugified title only when there is
 * no id. Two records are the same project when their identities match, which
 * keeps dedupe working even if a title's capitalisation or spacing changes.
 */
export function projectIdentity(record) {
    if (!record || typeof record !== 'object') return '';

    const id = record.id ?? record._id;
    if (id != null && String(id).trim()) return `id:${String(id).trim()}`;

    const slug = String(record.title ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug ? `slug:${slug}` : '';
}

/** Title slug, used for secondary comparisons and de-duplication hints. */
export function titleSlug(record) {
    return String(record?.title ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Does this record belong to the Lab?
 *
 * The dataset is the reliable boundary: the Lab is built from
 * `src/data/labSamples.json`, whose records carry a `snapshot-lab-*` id, while
 * portfolio records use a title-derived id. Status alone cannot decide this —
 * five portfolio projects are legitimately `live`/`beta`, and a portfolio
 * project's *tags* can contain words like "security" (Task Management App has a
 * `Security` tag) so keyword matching over tags produces false positives.
 *
 * Signals, in order:
 *  1. an explicit surface marker (`surface: 'lab'`, `kind: 'lab'`, `lab: true`);
 *  2. the `lab-sample` / `snapshot-lab-…` identity namespace;
 *  3. a status only the Lab uses (`development`, `experimental`) — these never
 *     appear on portfolio records;
 *  4. a `lab`-prefixed tag.
 *
 * A portfolio project that is `live` or `beta` therefore stays on the Projects
 * page, which is the conflict this module exists to remove.
 */
export const LAB_ID_PATTERN = /^(snapshot-)?lab([-_].*)?$/i;

export function isLabExperiment(record) {
    if (!record || typeof record !== 'object') return false;

    // 1. explicit markers win, whatever the status.
    if (String(record.surface || '').toLowerCase() === LAB_MARKER) return true;
    if (String(record.kind || '').toLowerCase() === LAB_MARKER) return true;
    if (record.lab === true) return true;

    // 2. dataset namespace (ids look like `snapshot-lab-1`).
    const rawId = String(record.id ?? record._id ?? '').replace(/^snapshot-/, '').trim();
    if (rawId && /^lab([-_]|$)/i.test(rawId)) return true;

    // Everything below additionally requires a Lab-only status.
    const status = normaliseStatus(record);
    if (!LAB_STATUSES.includes(status)) return false;

    // 3. statuses the portfolio never uses.
    if (status === 'development' || status === 'experimental') return true;

    // 4. an explicit lab tag.
    const tags = Array.isArray(record.tags) ? record.tags.map(tag => String(tag).toLowerCase()) : [];
    if (tags.some(tag => /^lab([-_]|$)/.test(tag))) return true;

    return false;
}

/**
 * Split a combined list into the two surfaces without losing anything.
 *
 * Returns `{ portfolio, lab }` where every input record appears exactly once:
 * a lab experiment goes to `lab`, everything else to `portfolio`. Duplicates
 * inside a surface are dropped by identity (first record wins).
 */
export function splitProjects(records) {
    const list = Array.isArray(records) ? records : [];
    const portfolio = [];
    const lab = [];
    const seenPortfolio = new Set();
    const seenLab = new Set();

    for (const record of list) {
        if (!record || typeof record !== 'object') continue;
        const identity = projectIdentity(record);
        if (!identity && !titleSlug(record)) continue;

        if (isLabExperiment(record)) {
            if (seenLab.has(identity)) continue;
            seenLab.add(identity);
            lab.push(record);
        } else {
            if (seenPortfolio.has(identity)) continue;
            seenPortfolio.add(identity);
            portfolio.push(record);
        }
    }

    return { portfolio, lab };
}

/**
 * Add saved records to a live list without duplicating anything.
 *
 * Matching is by identity first, then by title slug — so a snapshot record that
 * carries an `snapshot-…` id still dedupes against the live record with the same
 * title after a rebuild renames the ids.
 */
export function mergeUnique(liveRecords, savedRecords) {
    const live = Array.isArray(liveRecords) ? liveRecords.filter(Boolean) : [];
    const saved = Array.isArray(savedRecords) ? savedRecords.filter(Boolean) : [];

    const seenIds = new Set();
    const seenSlugs = new Set();
    for (const record of live) {
        const identity = projectIdentity(record);
        if (identity) seenIds.add(identity);
        const slug = titleSlug(record);
        if (slug) seenSlugs.add(slug);
    }

    const additions = [];
    for (const record of saved) {
        const identity = projectIdentity(record);
        const slug = titleSlug(record);
        if (identity && seenIds.has(identity)) continue;
        if (slug && seenSlugs.has(slug)) continue;
        if (identity) seenIds.add(identity);
        if (slug) seenSlugs.add(slug);
        additions.push(record);
    }

    return [...live, ...additions];
}

/**
 * Drop records that collide on identity or title, keeping the first.
 * Used on the Projects page so a live/snapshot mix can never render twice.
 */
export function dedupeProjects(records) {
    const list = Array.isArray(records) ? records.filter(Boolean) : [];
    const seenIds = new Set();
    const seenSlugs = new Set();
    const out = [];

    for (const record of list) {
        // A record with neither an id nor a usable title cannot be identified,
        // so keeping it would only produce an unnamed ghost card.
        if (!record || typeof record !== 'object') continue;
        const identity = projectIdentity(record);
        const slug = titleSlug(record);
        if (!identity && !slug) continue;
        if (identity && seenIds.has(identity)) continue;
        if (slug && seenSlugs.has(slug)) continue;
        if (identity) seenIds.add(identity);
        if (slug) seenSlugs.add(slug);
        out.push(record);
    }
    return out;
}

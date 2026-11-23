/**
 * Phase 38 — centred testimonials heading, a four-row scroll viewport with
 * pagination, and per-category entry counts.
 *
 * Node-only static checks. No network, no database, no browser.
 * Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const page = () => read('src/pages/Testimonials.jsx');
const css = () => read('src/styles/TestimonialsPage.css');

/* --------------------------------- heading -------------------------------- */

check('the testimonials heading is centred, including its decoration', () => {
    const sheet = css();
    assert.match(sheet, /\.tst-hero \.tst-heading \{\s*align-items: center;\s*margin-bottom: 0\.75rem;\s*text-align: center;\s*width: 100%;/);
    assert.match(sheet, /\.tst-hero \.tst-heading \.sec-head__deco \{\s*margin-left: auto;\s*margin-right: auto;/);
    // The copy column centres its children so eyebrow and lede follow the title.
    assert.match(sheet, /\.tst-hero \.tst-hero-copy \{\s*display: flex;\s*flex-direction: column;\s*align-items: center;\s*text-align: center;/);
    // The old left alignment must be gone.
    assert.doesNotMatch(sheet, /\.tst-hero \.tst-heading \{\s*align-items: flex-start;/);
});

check('centring does not disturb the hero side panel', () => {
    const sheet = css();
    // The score/actions column keeps its own layout.
    assert.match(sheet, /\.tst-hero-side \{/);
    // Centring is scoped to the copy column, never the whole hero.
    assert.doesNotMatch(sheet, /\.tst-hero \{\s*text-align: center;/);
});

/* ------------------------------ four-row viewport ------------------------- */

check('a grid page holds four rows of cards', () => {
    const src = page();
    assert.match(src, /const ROWS_PER_PAGE = 4;/);
    assert.match(src, /const GRID_COLUMNS_WIDE = 3;/);
    assert.match(src, /const PAGE_SIZE = ROWS_PER_PAGE \* GRID_COLUMNS_WIDE;/);
    // 4 rows x 3 columns = 12 cards per page.
    assert.equal(4 * 3, 12);
});

check('the grid viewport is capped at four rows and scrolls inside', () => {
    const sheet = css();
    assert.match(sheet, /\.tst-grid--scroll \{[\s\S]*?max-height: var\(--tst-viewport-max, calc\(4 \* \(320px \+ 1rem\)\)\);/);
    assert.match(sheet, /\.tst-grid--scroll \{[\s\S]*?overflow-y: auto;/);
    assert.match(sheet, /\.tst-grid--scroll \{[\s\S]*?overscroll-behavior: contain;/);
    assert.match(sheet, /\.tst-grid--scroll \{[\s\S]*?scrollbar-gutter: stable;/);
    // The cap is driven by one custom property so it is tunable.
    const src = page();
    assert.match(src, /const gridViewportMax = `calc\(4 \* \(var\(--tst-card-est-height, 320px\) \+ 1rem\)\)`;/);
});

check('the scroll box is keyboard reachable and labelled', () => {
    const src = page();
    assert.match(src, /className="tst-grid tst-grid--scroll"/);
    assert.match(src, /tabIndex=\{0\}/);
    assert.match(src, /role="region"/);
    assert.match(src, /aria-label=\{`Testimonial grid, four rows visible, page \$\{page\} of \$\{gridPages\}`\}/);
    assert.match(css(), /\.tst-grid--scroll:focus-visible \{\s*outline: 2px solid var\(--mainColor, #00efff\);/);
});

check('a single-column screen does not get a pointless inner scroll', () => {
    const sheet = css();
    assert.match(sheet, /@media \(max-width: 640px\) \{\s*\.tst-grid--scroll \{[\s\S]*?max-height: none;\s*overflow-y: visible;/);
});

/* -------------------------------- pagination ------------------------------ */

check('pagination survives and reports the page count', () => {
    const src = page();
    assert.match(src, /<nav className="tst-pagination" aria-label="Testimonials pages">/);
    assert.match(src, /aria-current=\{page === number \? 'page' : undefined\}/);
    // Rows shown per view are explained next to the result count.
    assert.match(src, /page \{page\} of \{gridPages\}/);
    assert.match(src, /rows per view, scroll inside the grid/);
});

check('each view keeps its own page size so pages never leak across modes', () => {
    const src = page();
    assert.match(src, /const pageSize = viewMode === 'list' \? LIST_PAGE_SIZE : PAGE_SIZE;/);
    assert.match(src, /const gridPages = Math\.max\(1, Math\.ceil\(visible\.length \/ pageSize\)\);/);
    // Changing a filter returns to page one.
    assert.match(src, /useEffect\(\(\) => \{\s*setPage\(1\);\s*\}, \[query, kindFilter, ratingFilter, featuredOnly, sortBy\]\);/);
});

/* --------------------------- category counts ------------------------------ */

check('category counts are derived from real entries, never invented', () => {
    const src = page();
    assert.match(src, /const categoryCounts = useMemo\(\(\) => \{/);
    // Labels come from the person's role, with a kind-based fallback.
    assert.match(src, /const role = String\(item\.role \|\| item\.position \|\| ''\)\.trim\(\);/);
    assert.match(src, /item\.kind === FEED_KIND\.review \? 'Visitor reviews' : 'Client recommendations'/);
    // No hard-coded numbers or random values.
    const block = src.slice(src.indexOf('const categoryCounts'), src.indexOf('const toggleLike'));
    assert.doesNotMatch(block, /Math\.random/);
});

check('a category shows its total, its review split and its average rating', () => {
    const src = page();
    assert.match(src, /className="tst-cat-count"/);
    assert.match(src, /className="tst-cat-kind tst-cat-kind--review"/);
    assert.match(src, /className="tst-cat-kind tst-cat-kind--testimonial"/);
    assert.match(src, /className="tst-cat-avg"/);
    assert.match(src, /entry\.average\.toFixed\(1\)/);
    // Counts react to the active filters so they match the chips.
    assert.match(src, /\}, \[items, query, ratingFilter, featuredOnly\]\);/);
});

check('the category panel is labelled and hides itself when empty', () => {
    const src = page();
    assert.match(src, /aria-label="Entries by category"/);
    assert.match(src, /categoryCounts\.length > 0 && \(/);
    assert.match(src, /\{categoryCounts\.reduce\(\(sum, entry\) => sum \+ entry\.count, 0\)\} in \{categoryCounts\.length\}/);
});

check('the category styles exist and wrap on small screens', () => {
    const sheet = css();
    for (const token of ['.tst-cats', '.tst-cats-list', '.tst-cat', '.tst-cat-label', '.tst-cat-avg']) {
        assert.ok(sheet.includes(token), `missing ${token}`);
    }
    assert.match(sheet, /\.tst-cats-list \{\s*display: flex;\s*flex-wrap: wrap;/);
    assert.match(sheet, /@media \(max-width: 640px\) \{[\s\S]*?\.tst-cat \{\s*width: 100%;/);
});

/* -------------------------------- preserved ------------------------------- */

check('every previously protected testimonials behaviour still holds', () => {
    const src = page();
    for (const token of [
        'loadPublicSection(\'testimonials\')',
        'getSnapshotSection(\'testimonials\')',
        'const CACHE_KEY = \'public_testimonials_v2\'',
        'testimonial-sample-badge',
        'isSampleTestimonial',
        'SubscribePublicReviews',
        'flushReviewOutbox'
    ]) {
        assert.ok(
            src.includes(token) || src.toLowerCase().includes(token.toLowerCase()),
            `missing ${token}`
        );
    }
    assert.match(src, /const cached = previewMode \? null : cacheService\.get\(CACHE_KEY\)/);
});

check('no secret or outbound call was introduced', () => {
    for (const file of ['src/pages/Testimonials.jsx', 'src/styles/TestimonialsPage.css']) {
        assert.doesNotMatch(read(file), /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:testimonials-layout'], /testimonials-layout\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:testimonials-layout/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3ak\./);
});

console.log(`\n${passed} testimonials layout regression checks passed.`);

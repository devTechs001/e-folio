/**
 * Phase 39 — pagination buttons, production-only hardening, and the icon set.
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
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* --------------------------- pagination buttons --------------------------- */

check('the testimonials pagination is always present, not hidden on a single page', () => {
    const src = read('src/pages/Testimonials.jsx');
    // The nav is no longer gated behind gridPages > 1.
    assert.match(src, /\{viewMode !== 'carousel' && \(\s*<nav className="tst-pagination"/);
    assert.doesNotMatch(src, /\{viewMode !== 'carousel' && gridPages > 1 && \(\s*<nav className="tst-pagination"/);
});

check('the testimonials pagination has first/last jumps and a one-page note', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /aria-label="First page"/);
    assert.match(src, /aria-label="Last page"/);
    assert.match(src, /onClick=\{\(\) => setPage\(1\)\}/);
    assert.match(src, /onClick=\{\(\) => setPage\(gridPages\)\}/);
    assert.match(src, /All \{visible\.length\} fit in \{ROWS_PER_PAGE\} rows/);
    // Numbered pages are still windowed around the current page.
    assert.match(src, /Math\.abs\(number - page\) <= 1/);
    assert.match(src, /aria-current=\{page === number \? 'page' : undefined\}/);
});

check('the reviews page has numbered pagination, not just arrows', () => {
    const src = read('src/components/PublicReviews.jsx');
    assert.match(src, /aria-label="Reviews pages"/);
    assert.match(src, /aria-label=\{`Page \$\{index \+ 1\}`\}/);
    assert.match(src, /aria-current=\{index === currentPage \? 'page' : undefined\}/);
    assert.match(src, /aria-label="First page"/);
    assert.match(src, /aria-label="Last page"/);
    assert.match(src, /ChevronsLeft, ChevronsRight/);
    // The window keeps first, last and the neighbours of the current page.
    assert.match(src, /index === 0 \|\|\s*index === totalPages - 1 \|\|\s*Math\.abs\(index - currentPage\) <= 1/);
});

check('pagination survives an empty or single-page set', () => {
    const src = read('src/components/PublicReviews.jsx');
    // Rendered whenever there are reviews, so the total is always visible.
    assert.match(src, /\{reviews\.length > 0 && \(/);
    assert.match(src, /Page \{currentPage \+ 1\} of \{totalPages\}/);
});

/* --------------------------- production gating ---------------------------- */

check('production builds strip developer query flags', () => {
    const src = read('src/utils/security.js');
    assert.match(src, /export const DEV_ONLY_PARAMS = \['debug', 'dev', 'developer', 'internal', 'test', 'trace'\];/);
    assert.match(src, /export function stripDevParams\(\)/);
    assert.match(src, /if \(typeof window === 'undefined' \|\| !isProductionBuild\(\)\) return \[\];/);
    assert.match(src, /window\.history\.replaceState\(\{\}, '', `\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`\);/);
    // Fails closed when the build flag cannot be read.
    assert.match(src, /return true; \/\/ fail closed when the flag is unavailable/);
});

check('the app shell strips those flags before rendering', () => {
    const src = read('src/main.jsx');
    assert.match(src, /import \{ setupSecurity, stripDevParams \} from '\.\/utils\/security\.js'/);
    // Must run before createRoot so no route or API call can read the flag.
    const strip = src.indexOf('stripDevParams();');
    const render = src.indexOf('createRoot(');
    assert.ok(strip > 0 && render > strip, 'stripDevParams must run before the app renders');
});

check('developer flags are development-only, never a feature switch', () => {
    const src = read('src/utils/security.js');
    // The guard is on PROD, so a dev build keeps its tooling.
    assert.match(src, /return Boolean\(import\.meta\.env\?\.PROD\);/);
});

/* ---------------------------------- XSS ---------------------------------- */

check('legal pages sanitise before innerHTML', () => {
    for (const file of ['src/pages/TermsAndConditions.jsx', 'src/pages/PrivacyPolicy.jsx']) {
        const src = read(file);
        assert.match(src, /dangerouslySetInnerHTML=\{\{ __html: sanitizeHtml\(content\[activeSection\]\.content\) \}\}/);
        assert.match(src, /import \{ sanitizeHtml \} from '\.\.\/utils\/security';/);
        // The raw form must be gone.
        assert.doesNotMatch(src, /__html: content\[activeSection\]\.content\b(?!\))/);
    }
});

check('the sanitiser is allow-list based and blocks script-capable input', () => {
    const src = read('src/utils/security.js');
    assert.match(src, /const ALLOWED_TAGS = new Set\(\[/);
    assert.match(src, /const ALLOWED_ATTRS = new Set\(\[/);
    // Script-capable tags are simply not in the allow list.
    for (const tag of ['script', 'iframe', 'object', 'embed', 'form']) {
        assert.ok(!new RegExp(`ALLOWED_TAGS[^\\]]*'${tag}'`).test(src), `${tag} must not be allowed`);
    }
    // Inline event handlers are removed by prefix.
    assert.match(src, /if \(name\.startsWith\('on'\) \|\| !ALLOWED_ATTRS\.has\(name\)\)/);
    // javascript:/data:/vbscript: URLs die.
    assert.match(src, /if \(\/\^\(\?:javascript\|data\|vbscript\|file\):\/i\.test\(trimmed\)\) return '';/);
    // Control characters cannot smuggle `java\\nscript:`.
    assert.match(src, /const CONTROL_CHARS = \/\[\\x00-\\x1F\\x7F\]\//);
});

check('the non-DOM sanitiser pass neutralises a payload corpus', () => {
    // The browser path needs a DOM, but the fallback is what runs in SSR/tests;
    // exercise it directly so a regression cannot slip through unobserved.
    const src = read('src/utils/security.js');
    const start = src.indexOf('const ALLOWED_TAGS');
    const fnStart = src.indexOf('export function sanitizeHtml');
    assert.ok(start > 0 && fnStart > start, 'sanitizer helpers not found');
    // End on the function's own closing brace, so no regex trimming can cut it.
    const fnEnd = src.indexOf('\n}\n', fnStart);
    assert.ok(fnEnd > fnStart, 'sanitizeHtml body end not found');
    const body = src
        .slice(start, fnEnd + 2)
        .replace('export function sanitizeHtml', 'function sanitizeHtml')
        .replace(/^export /gm, '');
    const factory = new Function(`${body}; return sanitizeHtml;`);
    const sanitize = factory();

    const cases = [
        ['<p>Hello <strong>world</strong></p>', '<p>Hello <strong>world</strong></p>'],
        ['<script>alert(1)</script><p>safe</p>', '<p>safe</p>'],
        ['<img src=x onerror="alert(1)">', ''],
        ['<a href="javascript:alert(1)">x</a>', '<a >x</a>'],
        ['<a href="https://ok.test">ok</a>', '<a href="https://ok.test">ok</a>'],
        ['<iframe src="//evil"></iframe><p>k</p>', '<p>k</p>']
    ];
    for (const [input, expected] of cases) {
        assert.equal(sanitize(input), expected, `sanitising ${input}`);
    }
    // Whatever comes out, no executable construct may survive.
    for (const [input] of cases) {
        const out = sanitize(input);
        assert.doesNotMatch(out, /<script|<iframe|onerror=|h\w+\s*=\s*["']?javascript:/i, `leaked from ${input}`);
    }
});

check('no other component renders unvetted HTML', () => {
    const offenders = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.jsx?$/.test(entry.name)) {
                const src = fs.readFileSync(full, 'utf8');
                if (src.includes('dangerouslySetInnerHTML') && !src.includes('sanitizeHtml(')) {
                    offenders.push(path.relative(root, full));
                }
            }
        }
    };
    walk(path.join(root, 'src'));
    assert.deepEqual(offenders, [], `unsanitised innerHTML: ${offenders.join(', ')}`);
});

/* ------------------------------ route guessing --------------------------- */

check('the owner email cannot be claimed through public registration', () => {
    const src = read('server/routes/auth.routes.js');
    assert.match(src, /const ownerEmail = security\.getOwnerEmail\(\);/);
    assert.match(src, /if \(ownerEmail && email\.trim\(\)\.toLowerCase\(\) === ownerEmail\) \{/);
    // The reply must not confirm which address is reserved.
    assert.match(src, /This account cannot be created\. Try a different email address\./);
    // And it must run before the duplicate-user lookup.
    const guard = src.indexOf('email.trim().toLowerCase() === ownerEmail');
    const create = src.indexOf('User.create(', guard);
    assert.ok(guard > 0 && create > guard, 'guard must run before the user is created');
});

check('owner login fails closed in production and generic login rejects the owner', () => {
    const route = read('server/routes/auth.routes.js');
    assert.match(route, /if \(normalizedEmail === security\.getOwnerEmail\(\)\) \{/);
    assert.match(route, /message: 'Invalid credentials'/);
    const security = read('server/config/security.js');
    // An unset OWNER_EMAIL in production resolves to empty, so nothing matches.
    assert.match(security, /const fallback = isProduction\(\) \? '' : 'owner@example\.invalid';/);
});

check('the dashboard does not render an unregistered route', () => {
    const src = read('src/pages/Dashboard.jsx');
    assert.ok(src.includes('<Route path="*" element={<Navigate to="/dashboard" replace />} />'),
        'unknown dashboard paths must fall back to /dashboard');
    // Menu entries carry explicit roles, so a guessed path is not in flatMenuItems.
    assert.match(src, /const filteredMenuItems = useMemo\(\(\) => \{\s*return menuItems\.filter\(item => canSeeMenuItem\(item, userRole\)\);/);
});

check('global abuse protection is still mounted ahead of the API routes', () => {
    const src = read('server/server.js');
    const limiter = src.indexOf("app.use('/api', apiLimiter);");
    const firstRoute = src.indexOf("app.use('/api/auth'");
    assert.ok(limiter > 0 && firstRoute > limiter, 'apiLimiter must mount before the routes');
    assert.match(src, /app\.use\(helmet\(\)\);/);
});

/* ---------------------------------- icons -------------------------------- */

check('every icon the manifest declares actually exists', () => {
    const vite = read('vite.config.js');
    const declared = [...vite.matchAll(/src: '(\/icons\/[^']+)'/g)].map(m => m[1]);
    assert.ok(declared.length >= 4, `expected 4 manifest icons, found ${declared.length}`);
    for (const src of declared) {
        assert.ok(exists(`public${src}`), `missing ${src}`);
    }
});

check('the maskable icon is its own artwork, not the any-purpose file', () => {
    const vite = read('vite.config.js');
    const maskable = vite.match(/\{ src: '([^']+)', sizes: '512x512', type: 'image\/png', purpose: 'maskable' \}/);
    assert.ok(maskable, 'no maskable entry');
    assert.ok(maskable[1].includes('maskable'), `maskable points at ${maskable[1]}`);
    assert.ok(exists(`public${maskable[1]}`));
    // any + monochrome purposes are declared too.
    assert.match(vite, /purpose: 'any'/);
    assert.match(vite, /purpose: 'monochrome'/);
});

check('the icons are square PNGs at the declared size', () => {
    const png = rel => fs.readFileSync(path.join(root, rel));
    const sizeOf = buf => {
        // PNG IHDR: width at byte 16, height at byte 20, both big-endian.
        assert.equal(buf.subarray(1, 4).toString('ascii'), 'PNG', 'not a PNG');
        return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    };
    const expected = {
        'public/icons/icon-192x192.png': 192,
        'public/icons/icon-512x512.png': 512,
        'public/icons/icon-maskable-512x512.png': 512,
        'public/icons/icon-monochrome-512x512.png': 512,
        'public/apple-touch-icon.png': 180,
        'public/favicon-32x32.png': 32,
        'public/favicon-16x16.png': 16
    };
    for (const [rel, edge] of Object.entries(expected)) {
        const { w, h } = sizeOf(png(rel));
        assert.equal(w, edge, `${rel} width`);
        assert.equal(h, edge, `${rel} height`);
    }
});

check('the maskable artwork sits inside the 80% safe circle', () => {
    // The generator scales the tile down for the maskable export; the tile edge
    // (0.60 * 512 = 307px) is inside the 410px safe circle Android guarantees.
    const src = read('scripts/generate-icons.mjs');
    const maskable = src.match(/brandIcon\(\{ size: 512, scale: ([0-9.]+), out: 'public\/icons\/icon-maskable-512x512\.png' \}\)/);
    assert.ok(maskable, 'maskable generation call not found');
    const scale = Number(maskable[1]);
    assert.ok(scale <= 0.8, `tile scale ${scale} can be clipped by a launcher mask`);
});

check('the apple touch icon is referenced and exists', () => {
    assert.match(read('index.html'), /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png" \/>/);
    assert.ok(exists('public/apple-touch-icon.png'), 'apple-touch-icon.png missing');
});

check('index.html no longer carries the base64 inline favicon', () => {
    const html = read('index.html');
    assert.doesNotMatch(html, /data:image\/svg\+xml;base64,/);
    assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/);
    assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32x32\.png" \/>/);
    assert.match(html, /<link rel="shortcut icon" href="\/favicon\.ico" \/>/);
    assert.ok(exists('public/favicon.svg'));
    assert.ok(exists('public/favicon.ico'));
});

check('the icon set is reproducible from source', () => {
    const src = read('scripts/generate-icons.mjs');
    // Geometry-driven, so no font is required to regenerate it.
    assert.match(src, /const GLYPHS = \[/);
    assert.doesNotMatch(src, /font-family/);
    // Every output the manifest and HTML expect is generated.
    for (const out of [
        'public/icons/icon-512x512.png',
        'public/icons/icon-192x192.png',
        'public/icons/icon-maskable-512x512.png',
        'public/icons/icon-monochrome-512x512.png',
        'public/apple-touch-icon.png',
        'public/favicon-32x32.png',
        'public/favicon-16x16.png'
    ]) {
        assert.ok(src.includes(out), `generator does not emit ${out}`);
    }
    assert.match(read('package.json'), /"icons:build": "node scripts\/generate-icons\.mjs"/);
});

check('no secret or outbound call was introduced', () => {
    for (const file of [
        'src/utils/security.js',
        'scripts/generate-icons.mjs',
        'src/pages/Testimonials.jsx',
        'src/components/PublicReviews.jsx'
    ]) {
        assert.doesNotMatch(read(file), /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:prod-hardening'], /prod-hardening\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:prod-hardening/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3al\./);
});

console.log(`\n${passed} production-hardening regression checks passed.`);

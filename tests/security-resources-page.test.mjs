/**
 * Regression checks: Security Audit dashboard + Resources page.
 * Node-only static checks: no framework, database, network or live server.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);

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

/* --------------------------------------- real offline audit engine ------ */

check('the static audit is re-runnable as data without changing its CLI', () => {
    const audit = read('server/scripts/security-audit.js');
    assert.match(audit, /function runAudit\(\)/);
    assert.match(audit, /findings\.length = 0/);
    assert.match(audit, /module\.exports = \{ main, runAudit, AUDIT_CHECKS \}/);
    assert.match(audit, /if \(require\.main === module\) main\(\)/);
    assert.match(audit, /process\.argv\.includes\('--json'\)/);
    assert.match(audit, /process\.argv\.includes\('--strict'\)/);
    assert.match(audit, /No findings\. All static checks passed\./);
    assert.equal((audit.match(/check[A-Z][A-Za-z]+\(\);/g) || []).length, 8);
});

check('the dashboard audit API is owner-only, cached and rate limited', () => {
    const controller = read('server/controllers/securityDashboard.controller.js');
    const routes = read('server/routes/admin.routes.js');
    assert.match(routes, /router\.use\(auth\)/);
    assert.match(routes, /router\.use\(isOwner\)/);
    assert.match(routes, /router\.get\('\/security-audit', auditLimiter, getSecurityAudit\)/);
    assert.match(routes, /router\.get\('\/security-controls', getSecurityControls\)/);
    assert.match(routes, /router\.get\('\/resources', getResources\)/);
    assert.match(routes, /const auditLimiter = rateLimit\(/);
    assert.match(controller, /AUDIT_TTL_MS = 60 \* 1000/);
    assert.match(controller, /cached: true/);
    assert.match(controller, /runAudit\(\)/);
    assert.match(controller, /durationMs: Date\.now\(\) - started/);
});

check('security controls expose presence only, never secret values', () => {
    const controller = read('server/controllers/securityDashboard.controller.js');
    assert.doesNotMatch(controller, /process\.env\.JWT_SECRET\s*\|\|/);
    assert.doesNotMatch(controller, /res\.json\([^)]*getJwtSecret|JWT_SECRET_VALUE/);
    assert.match(controller, /configurationIssueCount: security\.assertProductionConfig\(\)\.length/);
    assert.match(controller, /jwtSecretSource: 'server\/config\/security\.js'/);
    assert.match(controller, /mode: 'source-inspection'/);
    assert.match(controller, /not a live runtime probe/);
});

check('the resource inventory is allowlisted, metadata-only and secret-safe', () => {
    const controller = read('server/controllers/securityDashboard.controller.js');
    assert.match(controller, /const RESOURCE_GROUPS = \[/);
    assert.match(controller, /if \(\/\^\\\.env\(\\\.\|\$\)\/\.test\(base\) && !base\.endsWith\('\.example'\)\) return false/);
    assert.match(controller, /EXCLUDED_PATH/);
    assert.match(controller, /EXCLUDED_EXT/);
    assert.match(controller, /fs\.statSync\(file\)/);
    assert.doesNotMatch(controller, /readFileSync\(file\)/, 'inventory must not read file contents');
    assert.match(controller, /File names and metadata only/);
    assert.match(controller, /MAX_ITEMS = 400/);
});

/* --------------------------------------- client pages ------------------- */

check('both dashboard pages are routed and owner-only', () => {
    const dashboard = read('src/pages/Dashboard.jsx');
    assert.match(dashboard, /\/dashboard\/security-audit/);
    assert.match(dashboard, /\/dashboard\/resources/);
    assert.match(dashboard, /LazySecurityAuditDashboard/);
    assert.match(dashboard, /LazyResourcesPage/);
    assert.match(dashboard, /label: 'Security Audit'/);
    assert.match(dashboard, /label: 'Resources'/);
    assert.match(dashboard, /roles: \['owner'\]/);
    assert.match(dashboard, /category: 'Security'/);
});

check('the Security Audit page renders only real API results', () => {
    assert.ok(exists('src/components/dashboard/SecurityAuditDashboard.jsx'));
    const page = read('src/components/dashboard/SecurityAuditDashboard.jsx');
    const api = read('src/services/api.service.js');
    for (const needle of ['getSecurityAudit', 'getSecurityControls']) {
        assert.ok(page.includes(needle), `page must call ${needle}`);
        assert.match(api, new RegExp(`async ${needle}\\(`), `apiService must expose ${needle}`);
    }
    assert.match(page, /Promise\.allSettled/);
    assert.match(page, /getSecurityAudit\(force \? \{ refresh: '1' \} : \{\}\)/);
    assert.match(page, /No findings\. All static checks passed\./);
    assert.match(page, /Owner access required/);
    assert.match(page, /Security audit API is unavailable/);
    assert.match(page, /No audit data\. Run the audit again\./);
    assert.match(page, /Not a live|No live or external testing|static source inspection/);
    assert.doesNotMatch(page, /Math\.random|localhost|fetch\(/);
});

check('the Resources page lists real metadata and never fetches external URLs', () => {
    assert.ok(exists('src/components/dashboard/ResourcesPage.jsx'));
    const page = read('src/components/dashboard/ResourcesPage.jsx');
    const api = read('src/services/api.service.js');
    assert.match(page, /apiService\.getResources\(\)/);
    assert.match(api, /async getResources\(\)/);
    assert.match(page, /Resource inventory API is unavailable/);
    assert.match(page, /No files match this filter/);
    assert.match(page, /No inventory data available/);
    assert.match(page, /Owner access required/);
    assert.match(page, /rel="noopener noreferrer"/);
    assert.match(page, /referrerPolicy="no-referrer"/);
    assert.match(page, /downloadFile\(rows, 'resource-inventory\.csv'/);
    assert.match(page, /downloadFile\(JSON\.stringify\(inventory, null, 2\)/);
    assert.doesNotMatch(page, /Math\.random|localhost|fetch\(/);
});

check('curated security references are local, real and safe', () => {
    const data = json('src/data/securityResources.json');
    assert.ok(Array.isArray(data.references) && data.references.length >= 10);
    assert.ok(Array.isArray(data.categories) && data.categories.length >= 3);
    for (const ref of data.references) {
        assert.ok(ref.id && ref.title && ref.description);
        if (ref.kind === 'external') {
            assert.match(ref.url, /^https:\/\//);
            assert.ok(!ref.path, 'external references must not point at local files');
        } else {
            assert.equal(ref.kind, 'internal');
            assert.ok(exists(ref.path), `internal resource missing: ${ref.path}`);
            assert.equal(ref.url, undefined);
        }
    }
    const page = read('src/components/dashboard/ResourcesPage.jsx');
    assert.match(page, /securityResources\.json/);
    assert.match(page, /External links are never fetched|NOT fetched by this app/);
});

check('the pages cross-link to each other', () => {
    assert.match(read('src/components/dashboard/SecurityAuditDashboard.jsx'), /to="\/dashboard\/resources"/);
    assert.match(read('src/components/dashboard/ResourcesPage.jsx'), /to="\/dashboard\/security-audit"/);
});

check('no live, external or offensive activity was added', () => {
    for (const file of [
        'server/controllers/securityDashboard.controller.js',
        'src/components/dashboard/SecurityAuditDashboard.jsx',
        'src/components/dashboard/ResourcesPage.jsx'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /axios|http\.request|https\.request|child_process|execFile|fetch\(/);
        assert.doesNotMatch(src, /curl |nmap|sqlmap|pentest|exploit/);
    }
    assert.match(read('server/controllers/securityDashboard.controller.js'), /No network calls, no database/);
});

/* --------------------------------------- links & scripts ---------------- */

check('NetGate / project links were left exactly as they were', () => {
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    assert.match(read('server/scripts/seedTestimonialSamples.js'), /const PROJECT_URL = dataset\.previewUrl/);
});

check('the controller returns real local data offline (no DB, no network)', () => {
    // Only the config module is stubbed (it requires server-only deps). The
    // audit, control inspection and file inventory all run for real locally.
    const Module = nodeRequire('module');
    const original = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === '../config/security') {
            return { isProduction: () => false, assertProductionConfig: () => [] };
        }
        return original.apply(this, arguments);
    };
    try {
        const controller = nodeRequire(path.join(root, 'server/controllers/securityDashboard.controller.js'));
        const makeRes = () => ({ body: null, status() { return this; }, json(value) { this.body = value; return this; } });

        const auditRes = makeRes();
        controller.getSecurityAudit({ query: {} }, auditRes).catch(() => {});
        assert.equal(auditRes.body?.success, true);
        assert.equal(typeof auditRes.body.data.high, 'number');
        assert.equal(auditRes.body.data.checksRun.length, 8);
        assert.equal(auditRes.body.data.cached, false);
        assert.equal(auditRes.body.data.mode, 'static-offline');

        const cachedRes = makeRes();
        controller.getSecurityAudit({ query: {} }, cachedRes).catch(() => {});
        assert.equal(cachedRes.body.data.cached, true);

        const controlsRes = makeRes();
        controller.getSecurityControls({ query: {} }, controlsRes).catch(() => {});
        assert.equal(controlsRes.body?.success, true);
        assert.ok(controlsRes.body.data.controls.length >= 10);
        assert.equal(controlsRes.body.data.mode, 'source-inspection');

        const resourcesRes = makeRes();
        controller.getResources({ query: {} }, resourcesRes).catch(() => {});
        assert.equal(resourcesRes.body?.success, true);
        const inventory = resourcesRes.body.data;
        assert.ok(inventory.totalItems > 0);
        assert.equal(inventory.items.length, inventory.returnedItems);
        assert.equal(inventory.items.filter(item => /^\.env/.test(item.name) && !item.name.endsWith('.example')).length, 0);
        assert.ok(inventory.items.every(item => item.path && Number.isFinite(item.sizeBytes)));
        assert.equal(inventory.mode, 'local-filesystem');
    } finally {
        Module._load = original;
    }
});

check('the new regression checks are wired into both test scripts', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts.test, /security-resources-page\.test\.mjs/);
        assert.match(pkg.scripts['test:security-resources'], /security-resources-page\.test\.mjs/);
    }
});

console.log(`\n${passed} Security Audit / Resources page regression checks passed.`);

/**
 * Regression checks: live-preview wiring and lagging/performance issues.
 * Node-only static checks: no framework, database, network or live server.
 * Confidential — everything stays inside this checkout.
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

/* ---------------------------------- browser-facing URLs ------------------ */

check('API clients use a same-origin relative default, never localhost', () => {
    for (const file of [
        'src/services/api.service.js',
        'src/services/apiProxy.js',
        'src/components/dashboard/AIAssistantStyled.jsx'
    ]) {
        const src = read(file);
        assert.match(src, /import\.meta\.env\.VITE_API_URL \|\| '\/api'/);
        assert.doesNotMatch(src, /'http:\/\/localhost:5000\/api'/, `${file} must not hardcode localhost`);
    }
});

check('socket URL derives from the configured backend or the page origin', () => {
    const src = read('src/services/socket.service.js');
    assert.ok(src.includes('VITE_SOCKET_URL'));
    assert.ok(src.includes("configuredApi.replace") || src.includes("VITE_API_URL || '').replace("),
        'must strip a trailing /api from VITE_API_URL');
    assert.ok(src.includes('^(https?|wss?)') || src.includes('^https?'),
        'only an absolute origin may be used as the socket base');
    assert.ok(src.includes('window.location.origin'), 'must fall back to the page origin');
    assert.doesNotMatch(src, /'http:\/\/localhost:5000'/);
});


check('the dev server is preview-safe and proxies backend paths', () => {
    const src = read('vite.config.js');
    assert.match(src, /host: true/);
    assert.match(src, /allowedHosts: \['\.e2b\.app', 'localhost', '127\.0\.0\.1'\]/);
    assert.match(src, /const backendTarget = \(configuredApi\.replace\(\/\\\/api\\\/\?\$\/, ''\) \|\| 'http:\/\/localhost:5000'\)/);
    for (const route of ["'/api'", "'/socket.io'", "'/uploads'", "'/portfolios'"]) {
        assert.ok(src.includes(`${route}: { target: backendTarget`), `missing proxy for ${route}`);
    }
    assert.match(src, /'\/socket\.io': \{ target: backendTarget, changeOrigin: true, ws: true \}/);
    assert.match(src, /preview: \{[\s\S]*?proxy: backendProxies/,
        'production-build preview must proxy the same backend paths');
    assert.match(src, /include: \[/);
    for (const dep of ['framer-motion', 'socket.io-client', 'qrcode', 'recharts']) {
        assert.ok(src.includes(`'${dep}'`), `optimizeDeps must pre-bundle ${dep}`);
    }
});

/* ---------------------------------- artificial lag ----------------------- */

check('the landing page no longer waits on a fake one-second loader', () => {
    const src = read('src/pages/LandingPage.jsx');
    assert.doesNotMatch(src, /isLoading/);
    assert.doesNotMatch(src, /Simulate page load/);
    assert.doesNotMatch(src, /setTimeout\(\(\) => \{\s*setIsLoading/);
    assert.doesNotMatch(src, /landing-loader/);
    assert.match(src, /No artificial delay/);
    assert.match(src, /<Skills \/>|<Interests \/>|<Projects \/>|<Lab \/>|<Testimonials \/>/);
});

check('background-tab timers are paused or slowed down', () => {
    const files = [
        'src/pages/About.jsx',
        'src/pages/Testimonials.jsx',
        'src/contexts/LandingPageThemeContext.jsx',
        'src/components/dashboard/SkillsEditorEnhanced.jsx'
    ];
    for (const file of files) {
        assert.match(read(file), /document\.hidden/, `${file} must skip hidden-tab work`);
    }
    assert.match(read('src/components/dashboard/SkillsEditorEnhanced.jsx'), /\}, 30000\);/);
    assert.doesNotMatch(read('src/components/dashboard/SkillsEditorEnhanced.jsx'), /\}, 10000\);/);
});

check('the dead raw tracking WebSocket and its retry loop are gone', () => {
    const src = read('src/components/dashboard/AITrackingSystem.jsx');
    assert.doesNotMatch(src, /new WebSocket\(/);
    assert.doesNotMatch(src, /ws:\/\/localhost/);
    assert.doesNotMatch(src, /setTimeout\(setupWebSocket, 5000\)/);
    assert.doesNotMatch(src, /wsConnectionAttempts/);
    assert.match(src, /socketService\.connectTracking\(\)/);
    assert.match(src, /socketService\.onTrackingEvent/);
    assert.match(src, /socketService\.offTrackingEvent/);
    assert.match(src, /socketService\.disconnectTracking\(\)/);
    assert.match(src, /trackingEnvelopeRef/);
    // The toggle must not read stale state, and unmount must release the socket.
    assert.match(src, /setRealTimeEnabled\(prev => !prev\)/);
    assert.match(src, /return \(\) => stopWebSocket\(\);/);
});

check('owner dashboard inventories are cached instead of rescanned', () => {
    const src = read('server/controllers/securityDashboard.controller.js');
    assert.match(src, /INVENTORY_TTL_MS = 30 \* 1000/);
    assert.match(src, /const fromCache = entry =>/);
    assert.match(src, /controlsCache = toCache\(data\)/);
    assert.match(src, /resourcesCache = toCache\(data\)/);
    assert.match(src, /const cached = fromCache\(controlsCache\);/);
    assert.match(src, /const cached = fromCache\(resourcesCache\);/);
    assert.match(src, /auditCache = \{ data, expiresAt/);
    assert.ok((src.match(/cached: true/g) || []).length >= 3);
    assert.ok((src.match(/cached: false/g) || []).length >= 3);
});

/* ---------------------------------- safety ------------------------------- */

check('no NetGate / project link was changed', () => {
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    assert.match(read('src/utils/nexStore.js'), /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
});

check('still offline: no live probing, external calls or secret values', () => {
    for (const file of [
        'src/services/api.service.js',
        'src/services/socket.service.js',
        'src/components/dashboard/AITrackingSystem.jsx',
        'src/pages/LandingPage.jsx',
        'vite.config.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /Math\.random|axios|nmap|sqlmap|pentest|exploit/);
    }
    assert.match(read('server/controllers/securityDashboard.controller.js'), /No network calls, no database/);
});

check('the new regression checks are wired into both test scripts', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts.test, /live-preview-lag\.test\.mjs/);
        assert.match(pkg.scripts['test:live-preview'], /live-preview-lag\.test\.mjs/);
    }
});

console.log(`\n${passed} live preview / lagging-issue regression checks passed.`);

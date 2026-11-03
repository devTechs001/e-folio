/**
 * Regression checks for the profile/settings real-API wiring.
 * Node-only static checks: no framework, database or network.
 * Confidential — everything stays inside this checkout.
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

/* ------------------------------------------------------------ API layer --- */

check('every settings action used by the page has a real API method', () => {
    const src = read('src/services/api.service.js');
    const expected = [
        ['getProfile', '/profile'],
        ['getProfileStats', '/profile/stats'],
        ['getUserSettings', '/settings'],
        ['updateUserSettings', '/settings'],
        ['getApiKeys', '/settings/api-keys'],
        ['generateApiKey', '/settings/api-keys'],
        ['deleteApiKey', '/settings/api-keys/${keyId}'],
        ['getActiveSessions', '/settings/sessions'],
        ['terminateSession', '/settings/sessions/${sessionId}'],
        ['deleteAccount', '/settings/delete-account'],
        ['exportUserData', '/settings/export'],
        ['changePassword', '/settings/password/change']
    ];
    for (const [method, endpoint] of expected) {
        assert.match(src, new RegExp(`async ${method}\\(`), `missing ${method}()`);
        assert.ok(src.includes(endpoint), `${method} must target ${endpoint}`);
    }
});

check('webhook settings use the DB-backed /settings/webhooks API, not the in-memory store', () => {
    const src = read('src/services/api.service.js');
    assert.match(src, /async getWebhooks\(\)[\s\S]{0,120}request\('\/settings\/webhooks'\)/);
    assert.match(src, /async createWebhook\([\s\S]{0,160}request\('\/settings\/webhooks'/);
    assert.match(src, /async deleteWebhook\([\s\S]{0,160}request\(`\/settings\/webhooks\/\$\{id\}`/);
    assert.doesNotMatch(src, /request\('\/webhooks'\)/);
    assert.match(src, /Webhook updates are not available on the settings API/);
    assert.match(src, /Webhook tests are not available on the settings API/);
});

check('the Settings page loads every source independently and reports failures', () => {
    const src = read('src/components/dashboard/SettingsStyled.jsx');
    assert.match(src, /Promise\.allSettled\(\[/);
    for (const call of ['getUserSettings()', 'getApiKeys()', 'getWebhooks()', 'getActiveSessions()']) {
        assert.ok(src.includes(`apiService.${call}`), `missing ${call}`);
    }
    assert.match(src, /setLoadError\(/);
    assert.match(src, /loadError && \(/);
    assert.match(src, /onClick=\{loadUserSettings\}/);
    assert.doesNotMatch(src, /const \[.*\] = await Promise\.all\(\[/);
});

check('destructive settings actions send the payload the real API requires', () => {
    const src = read('src/components/dashboard/SettingsStyled.jsx');
    assert.match(src, /apiService\.deleteAccount\(\{\s*password: deletePassword,\s*confirmation: deleteConfirmation\s*\}\)/);
    assert.match(src, /deleteConfirmation !== 'DELETE'/);
    assert.match(src, /showDeleteModal && \(/);
    assert.match(src, /type="password"/);
    assert.match(src, /if \(!response\?\.success\) \{[\s\S]{0,160}Failed to export data/);
    assert.match(src, /response\.message \|\| 'Failed to delete API key'/);
    assert.match(src, /response\.message \|\| 'Failed to terminate session'/);
});

check('the Profile page reads the authoritative /profile record with allSettled', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.match(src, /Promise\.allSettled\(\[/);
    assert.match(src, /apiService\.getProfile\(\)/);
    assert.match(src, /profileRes\?\.data \|\| settingsRes\?\.data\?\.profile/);
    assert.match(src, /apiService\.getProfileStats\(\)/);
    assert.match(src, /setLoadError\(/);
    assert.match(src, /loadError && \(/);
    assert.doesNotMatch(src, /const \[\s*statsRes[\s\S]{0,400}await Promise\.all\(\[/);
});

check('the Profile page no longer shows invented trend percentages', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.doesNotMatch(src, /change: '\+\d/);
    assert.equal((src.match(/change: null/g) || []).length, 8);
    assert.match(src, /\{stat\.change && \(/);
    assert.match(src, /profileStats\?\.engagementRate \?\? '—'/);
    assert.match(src, /profileStats\?\.completedProjects \?\? '—'/);
    assert.match(src, /profileStats\?\.totalLikes \?\? '—'/);
});

check('settings controller answers errors without leaking internals', () => {
    const src = read('server/controllers/settings.controller.js');
    assert.match(src, /console\.error\('Update settings error:'[\s\S]{0,220}message: 'Failed to update settings'/);
    assert.doesNotMatch(src, /message: error\.message \|\| 'Failed to update settings'/);
});

/* --------------------------------------------- no project link changes --- */

check('NetGate / project links were left exactly as they were', () => {
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    assert.equal(network.links.demo, 'https://net-gate-portal.netlify.app/');
    const testimonials = json('src/data/testimonialSamples.json');
    assert.equal(testimonials.previewUrl, 'https://net-gate-portal.netlify.app/');
});

console.log(`\n${passed} profile/settings real-API regression checks passed.`);

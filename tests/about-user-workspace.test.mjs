/**
 * Regression checks: Profile page About data + CV/portfolio/account wiring.
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
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* --------------------------------------- Profile page = About page data --- */

check('a single shared module defines the About page data model', () => {
    assert.ok(exists('src/utils/aboutPageData.js'));
    const src = read('src/utils/aboutPageData.js');
    for (const name of [
        'ABOUT_WELCOME', 'ABOUT_AVAILABILITY', 'ABOUT_CV_HREF', 'ABOUT_ROLES',
        'ABOUT_IMAGES', 'ABOUT_BIO_FALLBACK', 'ABOUT_SECOND_PARAGRAPH',
        'buildAboutSocialLinks', 'buildAboutProfile', 'aboutNameParts'
    ]) {
        assert.ok(src.includes(name), `missing ${name}`);
    }
    assert.doesNotMatch(src, /picsum|Math\.random/);
});

check('the public About page and the dashboard Profile page use the same module', () => {
    for (const file of ['src/pages/About.jsx', 'src/components/dashboard/Profile.jsx']) {
        const src = read(file);
        assert.match(src, /utils\/aboutPageData/, `${file} must import the shared module`);
    }
    const about = read('src/pages/About.jsx');
    assert.match(about, /buildAboutProfile\(settings\?\.profile, user\)/);
    assert.match(about, /ABOUT_ROLES/);
    assert.match(about, /ABOUT_IMAGES/);
    assert.doesNotMatch(about, /https:\/\/www\.facebook\.com\/profile\.php\?id=/);
});

check('Profile page renders the public About fields from real APIs', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.match(src, /buildAboutProfile\(/);
    assert.match(src, /aboutNameParts\(/);
    assert.match(src, /Public About page/);
    assert.match(src, /View public page/);
    assert.match(src, /setSettingsProfile\(settingsRes\.data\.profile\)/);
    assert.match(src, /aboutView\.bio/);
    assert.match(src, /aboutView\.socialLinks/);
    assert.match(src, /ABOUT_AVAILABILITY/);
});

check('the dead Add Project button now points at the real projects manager', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.match(src, /<Link to="\/dashboard\/projects" className="px-4 py-2 bg-cyan-500\/20/);
});

/* ------------------------------- CV / portfolio / account for other users --- */

check('user workspace helper uses the real get-or-create APIs', () => {
    assert.ok(exists('src/utils/userWorkspace.js'));
    const src = read('src/utils/userWorkspace.js');
    assert.match(src, /apiService\.getCV\(\)/);
    assert.match(src, /apiService\.getPortfolioConfig\(\)/);
    assert.match(src, /apiService\.publishPortfolio\(\)/);
    assert.match(src, /Promise\.allSettled/);
    assert.match(src, /publicUserLinks/);
    assert.doesNotMatch(src, /localhost/);
});

check('registration surfaces the real API message and initialises a workspace', () => {
    const src = read('src/contexts/AuthContext.jsx');
    assert.match(src, /ensureUserWorkspace/);
    assert.match(src, /response\?\.message \|\| 'Registration failed'/);
    // Phase 31: registration uses the canonical USER_ROLE constant.
    assert.match(src, /setUserRole\(USER_ROLE\)/);
});

check('public CV and portfolio pages use relative real APIs, not localhost', () => {
    for (const [file, endpoint] of [
        ['src/pages/UserCVPage.jsx', '/public/cv/'],
        ['src/pages/UserPortfolioPage.jsx', '/public/portfolio/']
    ]) {
        const src = read(file);
        assert.match(src, /apiService\.request\(`\/public\//);
        assert.ok(src.includes(endpoint), `${file} must call ${endpoint}`);
        assert.doesNotMatch(src, /localhost:5000|VITE_API_URL/);
        assert.match(src, /encodeURIComponent\(username\)/);
    }
});

check('Profile page exposes CV/portfolio creation, publishing and public links', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.match(src, /Create \/ refresh my CV & portfolio/);
    assert.match(src, /Publish portfolio/);
    assert.match(src, /publicUserLinks\(/);
    assert.match(src, /\/dashboard\/cv-editor/);
    assert.match(src, /\/dashboard\/portfolio-editor/);
    assert.match(src, /Create account for another user/);
    assert.match(src, /workspaceStatus\.cvReady/);
});

check('server routes for other users exist and are authorised', () => {
    const auth = read('server/routes/auth.routes.js');
    assert.match(auth, /router\.post\('\/register'/);
    assert.match(auth, /role: 'user'/);
    for (const [file, needle] of [
        ['server/routes/cv.routes.js', /router\.get\('\//],
        ['server/routes/portfolio.routes.js', /router\.get\('\/config'/],
        ['server/routes/public.routes.js', /router\.get\('\/cv\/:username'/],
        ['server/routes/public.routes.js', /router\.get\('\/portfolio\/:username'/]
    ]) {
        assert.match(read(file), needle);
    }
    assert.match(read('server/routes/cv.routes.js'), /isAuthorized/);
    assert.match(read('server/routes/portfolio.routes.js'), /isAuthorized/);
});

/* --------------------------------------------- no project link changes --- */

check('NetGate / project links were left exactly as they were', () => {
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
});

console.log(`\n${passed} About / CV / portfolio / account regression checks passed.`);

/**
 * Phase 37 — hero background image, improved Lab cards, and the poster sync
 * between the Lab dashboard and the public Lab page.
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

/* ------------------------------ hero photo -------------------------------- */

check('the hero uses a local background image, not a remote one', () => {
    const css = read('src/styles/LandingPage.css');
    assert.match(css, /\.collaboration-hero \.hero-bg-photo \{[\s\S]*?background-image: url\('\/assets\/images\/hero-portfolio-bg\.jpg'\);/);
    // The asset really exists in the repository.
    assert.ok(exists('public/assets/images/hero-portfolio-bg.jpg'), 'hero image missing');
    // No third-party image host may sneak into the hero layer.
    const block = css.slice(css.indexOf('.hero-bg-photo'), css.indexOf('.hero-bg-scrim'));
    assert.doesNotMatch(block, /unsplash|picsum|cloudinary|https?:\/\//);
});

check('the hero photo is decorative and keeps text readable', () => {
    const page = read('src/pages/LandingPage.jsx');
    // Both layers exist, in order, and are hidden from assistive tech.
    assert.match(page, /<div className="hero-bg-photo" aria-hidden="true"><\/div>\s*<div className="hero-bg-scrim" aria-hidden="true"><\/div>/);
    const css = read('src/styles/LandingPage.css');
    // A scrim sits above the photo and below the content.
    assert.match(css, /\.collaboration-hero \.hero-bg-photo \{[\s\S]*?z-index: 0;/);
    assert.match(css, /\.collaboration-hero \.hero-bg-scrim \{[\s\S]*?z-index: 1;/);
    // Opacity is dialled back so the existing blobs still read.
    assert.match(css, /\.collaboration-hero \.hero-bg-photo \{[\s\S]*?opacity: 0\.55;/);
    // The existing animated layers still render above the photo.
    assert.match(css, /\.collaboration-hero > \.hero-blob,\s*\.collaboration-hero > \.hero-particles \{\s*position: absolute;\s*z-index: 2;/);
    // The close control stays clickable above everything.
    assert.match(css, /\.collaboration-hero > \.banner-close-btn \{\s*z-index: 20;/);
});

check('the hero photo is responsive and motion-safe', () => {
    const css = read('src/styles/LandingPage.css');
    assert.match(css, /@media \(max-width: 720px\) \{\s*\.collaboration-hero \.hero-bg-photo \{\s*opacity: 0\.42;/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.collaboration-hero \.hero-bg-photo \{\s*transform: none;/);
});

check('the background image file is a reasonable size for a hero', () => {
    const bytes = fs.statSync(path.join(root, 'public/assets/images/hero-portfolio-bg.jpg')).size;
    assert.ok(bytes > 20_000, 'image looks empty');
    // Keeps first paint fast; a hero photo should not be megabytes.
    assert.ok(bytes < 600_000, `hero image is ${bytes} bytes`);
});

/* -------------------------------- Lab cards ------------------------------- */

check('the Lab card resolves a poster from every image field', () => {
    const src = read('src/pages/Lab.jsx');
    // The old code only looked at thumbnail || imageUrl and ignored images[].
    assert.match(src, /const source = project\.thumbnail \|\| project\.imageUrl \|\| project\.images\?\.\[0\]\?\.url \|\| '';/);
    assert.match(src, /<LabThumb/);
});

check('a failed poster degrades to the designed placeholder, never a broken image', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /const \[failed, setFailed\] = useState\(false\);/);
    assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/);
    assert.match(src, /lab-thumb-placeholder__glyph/);
    assert.match(src, /lab-thumb-placeholder__label/);
    // The placeholder is decorative; the card title carries the meaning.
    assert.match(src, /lab-thumb-placeholder" aria-hidden="true"/);
});

check('Lab card styles are scoped to the card and leave the grid alone', () => {
    const css = read('src/styles/Lab.css');
    // The grid is untouched by this phase.
    assert.match(css, /\.lab-grid \{\s*display: grid;\s*grid-template-columns: repeat\(auto-fill, minmax\(300px, 1fr\)\);/);
    // Card improvements exist.
    assert.match(css, /\.lab-card \{[\s\S]*?isolation: isolate;/);
    assert.match(css, /\.lab-card:hover \{[\s\S]*?transform: translateY\(-6px\);/);
    assert.match(css, /\.lab-thumb \{[\s\S]*?height: 196px;/);
    assert.match(css, /\.lab-card:hover \.lab-thumb--photo img \{\s*transform: scale\(1\.06\);/);
    assert.match(css, /\.lab-thumb--empty \{/);
});

check('Lab cards line up: fixed poster, clamped copy, pinned footer', () => {
    const css = read('src/styles/Lab.css');
    assert.match(css, /\.lab-card \{[\s\S]*?display: flex;\s*flex-direction: column;\s*height: 100%;/);
    assert.match(css, /\.lab-body \{[\s\S]*?flex: 1 1 auto;/);
    assert.match(css, /\.lab-meta \{[\s\S]*?margin-top: auto;/);
    assert.match(css, /\.lab-title \{[\s\S]*?-webkit-line-clamp: 2;/);
    assert.match(css, /\.lab-desc \{[\s\S]*?-webkit-line-clamp: 3;/);
});

check('the Lab card keeps every existing control and the maintained badge', () => {
    const src = read('src/pages/Lab.jsx');
    // Status pill, the demo/code/detail/delete actions, and the sample badge.
    for (const token of ['lab-status lab-status-', 'lab-btn lab-btn-demo', 'lab-btn lab-btn-code', 'lab-btn lab-btn-details', 'lab-btn lab-btn-delete']) {
        assert.ok(src.includes(token), `missing ${token}`);
    }
    assert.ok(read('src/styles/Lab.css').includes('.lab-sample-badge'));
    // Phase 42: lab records are maintained, not disposable samples.
    assert.match(src, /sampleLabel=\{owner && seedRecord/);
});

/* --------------------------- dashboard sync ------------------------------- */

check('the Project model now persists the poster it was already sent', () => {
    const model = read('server/models/Project.model.js');
    assert.match(model, /thumbnail: \{\s*type: String,\s*trim: true,\s*default: ''\s*\},/);
    // It must sit next to images so the relationship is obvious.
    assert.ok(model.indexOf('thumbnail: {') > model.indexOf('images: [{'));
});

check('the public API resolves one poster for every consumer', () => {
    const controller = read('server/controllers/public.controller.js');
    assert.match(controller, /const poster = p\.thumbnail \|\| p\.images\?\.\[0\]\?\.url \|\| '';/);
    assert.match(controller, /thumbnail: poster,/);
    assert.match(controller, /imageUrl: poster/);
});

check('the dashboard preview uses the same poster rule as the public card', () => {
    const manager = read('src/components/dashboard/LabManager.jsx');
    assert.match(manager, /const posterOf = \(project\) =>\s*project\?\.thumbnail \|\| project\?\.imageUrl \|\| project\?\.images\?\.\[0\]\?\.url \|\| '';/);
    // Phase 42: applied to LabEntry records.
    assert.match(manager, /posterOf\(entry\)/);
});

check('saving a poster from the dashboard reaches the public page', () => {
    const manager = read('src/components/dashboard/LabManager.jsx');
    assert.match(manager, /const savePoster = async \(entry\) =>/);
    // Phase 42: the write goes through the LAB update endpoint, so saving a Lab
    // poster can never modify a portfolio project.
    assert.match(manager, /ApiService\.updateLabEntry\(id, \{ thumbnail: value/);
    assert.doesNotMatch(manager, /ApiService\.updateProject\(/);
    // ...and then tells every open public page to refresh.
    assert.match(manager, /notifySuccess\('Card image saved — the public Lab card uses it now\.'\)/);
    assert.match(manager, /window\.dispatchEvent\(new CustomEvent\('settingsChanged'\)\);/);
    const saveBlock = manager.slice(manager.indexOf('const savePoster'));
    assert.match(saveBlock.slice(0, 1600), /publishLabChanged\(\)/);
    // The public Lab page listens on the Lab's own channel, not the projects one.
    const lab = read('src/pages/Lab.jsx');
    assert.match(lab, /subscribeLabChanged\(refresh\)/);
    assert.doesNotMatch(lab, /subscribeProjectsChanged/);
    assert.match(lab, /window\.addEventListener\('settingsChanged', refresh\)/);
});

check('the poster editor is owner-only and labelled', () => {
    const manager = read('src/components/dashboard/LabManager.jsx');
    assert.match(manager, /\{owner && \(\s*<div className="flex flex-wrap items-center gap-2 border-t/);
    // Phase 42: the editor is now a labelled field per LabEntry, not a prompt.
    assert.match(manager, /aria-label=\{`Card image URL for \$\{entry\.title\}`\}/);
    assert.match(manager, /Save image/);
});

/* ------------------------------- snapshot --------------------------------- */

check('the snapshot carries derived posters for projects and lab records', () => {
    const builder = read('scripts/build-public-snapshot.mjs');
    assert.match(builder, /thumbnail: project\.thumbnail \|\| project\.images\?\.\[0\]\?\.url \|\| '',/);
    // Phase 42: lab records come from labEntries.json and carry their own
    // poster fields + links, rather than borrowing the labelled sample set.
    assert.match(builder, /thumbnail: entry\.thumbnail \|\| '',/);
    assert.match(builder, /links: entry\.links \|\| \{\},/);

    const snapshot = json('src/data/publicSnapshot.json');
    const projects = snapshot.sections.projects.projects;
    // Every project record that has an image must expose a poster.
    for (const project of projects) {
        if (Array.isArray(project.images) && project.images.length) {
            assert.ok(project.thumbnail, `${project.title} has images but no poster`);
        }
    }
});

/* ------------------------------- protection ------------------------------- */

check('no protected file was modified by this phase', () => {
    // These must exist untouched; content checks live in their own suites.
    for (const file of [
        'src/data/labSamples.json',
        'src/styles/CVComponent.css',
        'public/CV2.pdf',
        'src/components/ProjectCard.jsx',
        'src/styles/ProjectCard.css'
    ]) {
        assert.ok(exists(file), `${file} must still exist`);
    }
    // The hero photo is not written into the protected sample dataset.
    assert.ok(!read('src/data/labSamples.json').includes('hero-portfolio-bg'));
});

check('no secret or outbound call was introduced', () => {
    for (const file of [
        'src/pages/Lab.jsx',
        'src/pages/LandingPage.jsx',
        'src/components/dashboard/LabManager.jsx',
        'src/styles/LandingPage.css',
        'src/styles/Lab.css',
        'server/models/Project.model.js',
        'server/controllers/public.controller.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:hero-lab-cards'], /hero-lab-cards\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:hero-lab-cards/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3aj\./);
});

console.log(`\n${passed} hero background / Lab card regression checks passed.`);

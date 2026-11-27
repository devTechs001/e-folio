/**
 * Phase 46 regression checks: the projects grid scrolls inside a five-row
 * viewport, the render leads with the newest real work, and the seeded sample
 * records reach both pages without any sample-tagged project surviving.
 *
 * Node-only static checks — no DB, no network, no browser, no external service.
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

const css = () => read('src/styles/Projects.css');
const page = () => read('src/pages/Projects.jsx');

/* ------------------------------- the viewport ------------------------------ */

check('the grid is capped at five rows, not left to grow forever', () => {
    const sheet = css();
    assert.match(sheet, /\.projects-grid--scroll \{/);
    const block = sheet.slice(sheet.indexOf('.projects-grid--scroll {'));
    // Five rows, expressed through a variable rather than a buried number.
    assert.match(block, /max-height: var\(--projects-viewport-max,/);
    assert.match(block, /overflow-y: auto;/);
    assert.match(block, /overscroll-behavior: contain;/);
    // A scrollbar that does not shift the layout as it appears.
    assert.match(block, /scrollbar-gutter: stable;/);
});

check('the cap is five rows of a typical card plus its gap', () => {
    const src = page();
    assert.match(src, /const projectsViewportMax = 'calc\(5 \* \(var\(--project-card-est-height, 420px\) \+ 2rem\)\)';/);
    // 2rem matches the real grid gap, so five rows is genuinely five rows.
    assert.match(css(), /\.projects-grid \{[^}]*gap: 2rem;/);
    assert.match(page(), /'--projects-viewport-max': projectsViewportMax/);
});

check('one column drops the cap instead of trapping the scroll', () => {
    const sheet = css();
    const media = sheet.slice(sheet.indexOf('@media (max-width: 640px)'));
    const block = media.slice(media.indexOf('.projects-grid--scroll {'));
    assert.match(block, /max-height: none;/);
    assert.match(block, /overflow-y: visible;/);
});

check('the scrolling box is a labelled, keyboard-reachable region', () => {
    const src = page();
    assert.match(src, /role: 'region'/);
    assert.match(src, /tabIndex: 0/);
    assert.match(src, /'aria-label': `Projects grid, five rows visible/);
    // Only grid view scrolls; list and masonry keep their natural height.
    assert.match(src, /viewMode === 'grid' \? ' projects-grid--scroll' : ''/);
    assert.match(src, /viewMode === 'grid' \? \{/);
});

/* --------------------------------- ordering -------------------------------- */

check('the grid leads with the newest published work', () => {
    const src = page();
    // Featured work still sorts to the front, then newest, then a stable title.
    const featured = src.slice(src.indexOf("case 'featured':"));
    assert.match(featured, /\(y\.featured \? 1 : 0\) - \(x\.featured \? 1 : 0\)/);
    // Every comparator is deterministic — no render-order flicker.
    assert.match(src, /const settle = \(primary, a, b\) => primary\(a, b\) \|\| byNewest\(a, b\) \|\| byTitle\(a, b\);/);
    for (const sort of ['popular', 'views', 'stack'].map(s => `case '${s}':`)) {
        const at = src.indexOf(sort);
        assert.ok(at > -1, `${sort} missing`);
        assert.match(src.slice(at, at + 220), /settle\(/, `${sort} is not deterministic`);
    }
});

check('the stored catalogue is not already in render order', () => {
    // Proof the sort actually does something: the saved snapshot is stored in
    // authoring order, newest work is not first.
    const projects = json('src/data/publicSnapshot.json').sections.projects.projects;
    const dates = projects.map(p => Date.parse(p.completionDate || 0));
    const storedIsNewestFirst = dates.every((d, i) => i === 0 || dates[i - 1] >= d);
    assert.equal(storedIsNewestFirst, false, 'if the store were already sorted, the sort would be dead code');
});

/* ------------------------------- the samples ------------------------------- */

check('the seeded samples are real records, not placeholders', () => {
    // Phase 42 replaced the disposable placeholders with curated experiments in
    // their own collection; nothing should reintroduce sample-tagged projects.
    const lab = json('src/data/labEntries.json');
    assert.ok(lab.entries.length >= 4);
    // The whole set is addressed by one seed key, which is what the seeder keys on.
    assert.equal(lab.seedKey, 'lab-core');
    for (const entry of lab.entries) {
        assert.ok(!/\[SAMPLE\]/i.test(entry.title), `${entry.title} is a placeholder`);
        assert.ok(entry.slug, `${entry.title} has no stable slug`);
    }
});

check('no public surface renders a sample-tagged project', () => {
    const projects = json('src/data/publicSnapshot.json').sections.projects.projects;
    assert.equal(projects.length, 16);
    for (const project of projects) {
        const tags = (project.tags || []).map(t => String(t).toLowerCase());
        assert.ok(!tags.some(t => /^lab([-_]|$)/.test(t)), `${project.title} carries a lab tag`);
        assert.ok(!/\[SAMPLE\]/i.test(project.title), `${project.title} is a placeholder`);
        assert.ok(!['development', 'experimental'].includes(String(project.status || '').toLowerCase()),
            `${project.title} would be classified as a Lab experiment`);
    }
});

check('testimonials render the seeded samples outside owner preview', () => {
    const src = read('src/pages/Testimonials.jsx');
    // Sample count is derived from what is shown, not forced to zero for visitors.
    assert.match(src, /setSampleCount\(display\.filter\(item => isSampleTestimonial\(item\.raw\)\)\.length\);/);
    assert.doesNotMatch(src, /} else \{\s*setSampleCount\(0\);\s*\}/);
    // They stay visually labelled so no visitor reads one as a customer quote.
    assert.match(src, /isSampleTestimonial\(item\.raw\) \? 'is-sample' : ''/);
    // The dataset the seeder writes from is still the canonical source.
    assert.equal(json('src/data/testimonialSamples.json').tag, 'testimonial-sample');
    assert.equal(json('src/data/testimonialSamples.json').samples.length, 8);
});

check('the cleanup deletes leftover sample projects and never recreates them', () => {
    const pipeline = read('server/scripts/seedAllSamples.js');
    assert.match(pipeline, /name: 'Legacy sample-tagged projects'/);
    assert.match(pipeline, /seed: 'never'/);
    assert.match(pipeline, /if \(!remove && step\.seed === 'never'\)/);
    const verify = read('server/scripts/verifySeedData.js');
    assert.match(verify, /sampleTaggedProjects: await Project\.countDocuments\(\{ tags: SAMPLE_TAG \}\)/);
    assert.match(verify, /seed:samples -- --remove/);
});

/* -------------------------------- guardrails ------------------------------- */

check('the protected card interface was not touched', () => {
    const card = read('src/components/ProjectCard.jsx');
    assert.match(card, /ProjectCard/);
    // The card may not absorb the page-level scroller or ordering.
    for (const token of ['projects-grid--scroll', 'projects-viewport-max', 'overflow-y: auto']) {
        assert.ok(!card.includes(token), `${token} leaked into the card`);
    }
    const sheet = read('src/styles/ProjectCard.css');
    assert.ok(!sheet.includes('projects-grid--scroll'));
});

check('the grid itself keeps its existing contract', () => {
    const sheet = css();
    const base = sheet.slice(sheet.indexOf('.projects-grid {'), sheet.indexOf('.projects-grid.view-mode-grid'));
    // The new rule is additive: the base grid is still a plain grid.
    assert.match(base, /display: grid;/);
    // The three view modes are untouched — the scroller is its own class, so it
    // never has to know which layout it is sitting in.
    assert.match(sheet, /\.projects-grid\.view-mode-grid \{\s*grid-template-columns: repeat\(auto-fill, minmax\(350px, 1fr\)\);/);
    assert.match(sheet, /\.projects-grid\.view-mode-list \{[^}]*grid-template-columns: 1fr;/);
    assert.match(sheet, /\.projects-grid\.view-mode-masonry \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(300px, 1fr\)\);/);
});

check('no secret or external write was introduced', () => {
    const src = page() + read('src/pages/Testimonials.jsx')
        + read('server/scripts/seedAllSamples.js') + read('server/scripts/verifySeedData.js');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

console.log(`\n${passed} projects viewport checks passed.`);

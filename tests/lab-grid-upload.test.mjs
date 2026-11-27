/**
 * Phase 47 regression checks: the Lab grid scrolls inside a four-row viewport,
 * every experiment carries a real committed poster, the dashboard can upload
 * one, and the modal behaves as a dialog.
 *
 * Node-only static checks — no DB, no network, no browser. Confidential.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const labCss = () => read('src/styles/Lab.css');
const labPage = () => read('src/pages/Lab.jsx');

/* ------------------------------- the viewport ------------------------------ */

check('the lab grid is capped at four rows', () => {
    const sheet = labCss();
    assert.match(sheet, /\.lab-grid--scroll \{/);
    const block = sheet.slice(sheet.indexOf('.lab-grid--scroll {'));
    assert.match(block, /max-height: var\(--lab-grid-height,/);
    assert.match(block, /overflow-y: auto;/);
    assert.match(block, /overscroll-behavior: contain;/);
    assert.match(block, /scrollbar-gutter: stable;/);
});

check('the cap is four rows of a card plus the real 24px gap', () => {
    assert.match(labPage(), /const LAB_GRID_HEIGHT = 'calc\(4 \* \(var\(--lab-card-est-height, 430px\) \+ 24px\)\)';/);
    // 24px is the gap actually declared on the grid, so four rows is four rows.
    assert.match(labCss(), /\.lab-grid \{[^}]*gap: 24px;/);
    assert.match(labPage(), /'--lab-grid-height': LAB_GRID_HEIGHT/);
});

check('the base lab grid rule is untouched', () => {
    // Phase 37 pinned this template; the scroller must not have rewritten it.
    assert.match(labCss(), /\.lab-grid \{\s*display: grid;\s*grid-template-columns: repeat\(auto-fill, minmax\(300px, 1fr\)\);\s*gap: 24px;\s*\}/);
});

check('one column drops the cap instead of trapping the scroll', () => {
    const sheet = labCss();
    const media = sheet.slice(sheet.indexOf('@media (max-width: 640px)'));
    const block = media.slice(media.indexOf('.lab-grid--scroll {'));
    assert.match(block, /max-height: none;/);
    assert.match(block, /overflow-y: visible;/);
});

check('the scrolling grid is a labelled, keyboard-reachable region', () => {
    const src = labPage();
    assert.match(src, /className="lab-grid lab-grid--scroll"/);
    assert.match(src, /role="region"/);
    assert.match(src, /tabIndex=\{0\}/);
    assert.match(src, /aria-label=\{`Lab experiments, four rows visible/);
});

/* --------------------------------- posters --------------------------------- */

check('every seeded experiment has a real, committed poster', () => {
    const { entries } = json('src/data/labEntries.json');
    assert.equal(entries.length, 4);
    for (const entry of entries) {
        assert.ok(entry.thumbnail, `${entry.slug} has no thumbnail`);
        assert.match(entry.thumbnail, /^\/images\/lab\/[\w-]+\.jpg$/, `${entry.slug} thumbnail is not a local asset`);
        // A committed file, not a remote or stock URL.
        assert.ok(exists(`public${entry.thumbnail}`), `${entry.thumbnail} is missing from public/`);
        assert.ok(fs.statSync(path.join(root, `public${entry.thumbnail}`)).size > 10_000,
            `${entry.thumbnail} looks empty`);
        // The gallery mirrors the thumbnail so a detail view has something to show.
        assert.equal(entry.images?.[0]?.url, entry.thumbnail);
        assert.ok(entry.images[0].caption, `${entry.slug} image has no caption`);
    }
});

check('the public snapshot carries the same posters', () => {
    const recs = json('src/data/publicSnapshot.json').sections.labProjects.projects;
    assert.equal(recs.length, 4);
    for (const rec of recs) {
        assert.match(rec.thumbnail || '', /^\/images\/lab\//, `${rec.slug} snapshot poster missing`);
        assert.ok(exists(`public${rec.thumbnail}`), `${rec.thumbnail} is missing`);
    }
});

check('posters are local artwork, never stock placeholders', () => {
    // tests/lab-page.test.mjs bans these outright; assert it again for the new
    // field. Scoped to Lab records — the Projects section of the snapshot has
    // its own, older image policy and is not part of this change.
    const { entries } = json('src/data/labEntries.json');
    const recs = json('src/data/publicSnapshot.json').sections.labProjects.projects;
    const blob = JSON.stringify([...entries, ...recs]);
    assert.doesNotMatch(blob, /picsum\.photos|unsplash\.com|placehold\.co|via\.placeholder/);
    // Every Lab image URL is a path served from public/, not an off-site host.
    for (const entry of entries) {
        for (const img of [entry.thumbnail, ...(entry.images || []).map(i => i.url)]) {
            assert.match(img, /^\/(images|uploads)\//, `${entry.slug} points off-site: ${img}`);
        }
    }
});

check('the seeder fills posters without overwriting an uploaded one', () => {
    const seeder = read('server/scripts/seedLabEntries.js');
    // Applied outside the main $set, and only where no poster already exists.
    assert.match(seeder, /if \(entry\.thumbnail \|\| entry\.images\?\.length\)/);
    assert.match(seeder, /\$or: \[\{ thumbnail: '' \}, \{ thumbnail: \{ \$exists: false \} \}\]/);
    assert.match(seeder, /never revert a card image the owner uploaded/);
});

/* ---------------------------------- upload --------------------------------- */

check('a poster upload endpoint exists and is owner-only', () => {
    const routes = read('server/routes/lab.routes.js');
    const at = routes.indexOf("'/:id/poster'");
    assert.ok(at > -1, 'the poster route is missing');
    const decl = routes.slice(at - 260, at + 200);
    // Authentication and ownership, in that order, before the file is read.
    for (const guard of ['protect', 'isOwner', 'rateLimiter', 'uploadLabPoster', 'uploadPosterImage']) {
        assert.ok(decl.includes(guard), `${guard} is not applied to the poster route`);
    }
});

check('the upload is bounded and re-encoded, never stored raw', () => {
    const ctrl = read('server/controllers/lab.controller.js');
    assert.match(ctrl, /memoryStorage\(\)/);
    assert.match(ctrl, /limits: \{ fileSize: 5 \* 1024 \* 1024, files: 1 \}/);
    assert.match(ctrl, /image\\\/\(jpeg\|jpg\|png\|webp\|gif\)/);
    // sharp normalises every upload to a fixed JPEG, which also strips metadata.
    assert.match(ctrl, /resize\(1200, 800, \{ fit: 'cover', position: 'center' \}\)/);
    assert.match(ctrl, /\.jpeg\(\{ quality: 88, progressive: true \}\)/);
    // It writes inside the gitignored uploads tree, never into the repo source.
    assert.match(ctrl, /path\.join\(__dirname, '\.\.\/uploads\/lab'\)/);
    assert.match(read('.gitignore'), /server\/uploads\//);
});

check('the upload cannot escape its own directory or grow unbounded', () => {
    const ctrl = read('server/controllers/lab.controller.js');
    // Filename is derived from the record id, never from the uploaded name.
    assert.match(ctrl, /const filename = `lab_\$\{entry\._id\}_\$\{Date\.now\(\)\}\.jpg`/);
    assert.doesNotMatch(ctrl, /file\.originalname/, 'the client filename must not reach the filesystem');
    // images[] is replaced, not appended, so re-uploads do not accumulate rows.
    assert.match(ctrl, /\{ \$set: \{ thumbnail: url, images: \[\{ url, caption: entry\.title \|\| '' \}\] \} \}/);
    // Cleanup touches only files this endpoint wrote.
    assert.match(ctrl, /previous\.startsWith\('\/uploads\/lab\/'\)/);
});

check('the dashboard offers a real upload, with the URL field kept', () => {
    const mgr = read('src/components/dashboard/LabManager.jsx');
    assert.match(mgr, /await ApiService\.uploadLabPoster\(id, file\)/);
    assert.match(mgr, /type="file"/);
    assert.match(mgr, /accept="image\/jpeg,image\/png,image\/webp,image\/gif"/);
    // Client-side guards fail fast; the server re-validates regardless.
    assert.match(mgr, /file\.size > 5 \* 1024 \* 1024/);
    // The URL field is still there as a fallback for a hosted image.
    assert.match(mgr, /Card image URL for \$\{entry\.title\}/);
    assert.match(read('src/services/api.service.js'), /async uploadLabPoster\(id, file\)/);
});

/* ---------------------------------- modal ---------------------------------- */

check('the modal is a dialog and contains focus', () => {
    const modal = read('src/pages/ProjectModal.jsx');
    assert.match(modal, /role="dialog"/);
    assert.match(modal, /aria-modal="true"/);
    assert.match(modal, /tabIndex=\{-1\}/);
    // Tab cycles inside the dialog instead of walking into the page behind it.
    assert.match(modal, /e\.key !== 'Tab'/);
    assert.match(modal, /if \(e\.shiftKey && document\.activeElement === first\)/);
});

check('the modal returns focus to the card that opened it', () => {
    const modal = read('src/pages/ProjectModal.jsx');
    assert.match(modal, /returnFocusSelector/);
    assert.match(modal, /const target = document\.querySelector\(selector\);/);
    assert.match(modal, /if \(target\) \{ target\.focus\(\); return; \}/);
    // Opt-in: Projects passes nothing, so its behaviour is unchanged.
    assert.doesNotMatch(read('src/pages/Projects.jsx'), /returnFocusSelector/);
    assert.match(labPage(), /returnFocusSelector=/);
});

check('the focus effect does not steal focus on every re-render', () => {
    const modal = read('src/pages/ProjectModal.jsx');
    // Keyed on a stable flag, not the project object, which changes on like.
    assert.match(modal, /const isOpen = Boolean\(project\);/);
    assert.match(modal, /\}, \[isOpen, projectId, returnFocusSelector\]\);/);
});

check('lab cards are reachable by keyboard', () => {
    const src = labPage();
    assert.match(src, /role="button"/);
    assert.match(src, /tabIndex=\{0\}/);
    assert.match(src, /if \(e\.key === 'Enter' \|\| e\.key === ' '\)/);
    assert.match(src, /aria-label=\{`Open details for \$\{project\.title\}`\}/);
});

/* -------------------------------- guardrails ------------------------------- */

check('the garbled lab footer sentence is gone', () => {
    const src = labPage();
    assert.ok(!src.includes('Items tagged\n              the Lab dashboard'), 'the broken sentence is still there');
    assert.match(src, /separate from portfolio projects\. Manage them from the Lab dashboard\./);
});

check('no public diagnostics or secrets were introduced', () => {
    const blob = labPage() + read('src/pages/ProjectModal.jsx')
        + read('src/components/dashboard/LabManager.jsx')
        + read('server/controllers/lab.controller.js')
        + read('server/routes/lab.routes.js');
    assert.doesNotMatch(blob, /AIza[0-9A-Za-z_\-]{20,}|ghp_[A-Za-z0-9]{20,}|mongodb\+srv:\/\//);
    // The upload error stays generic to the client.
    assert.doesNotMatch(blob, /res\.status\(500\)\.json\(\{ success: false, message: error\.message/);
});

check('the Lab still keeps its own collection', () => {
    const routes = read('server/routes/lab.routes.js');
    const ctrl = read('server/controllers/lab.controller.js');
    // Phase 42 invariant: the Lab never reads or writes the Project collection.
    assert.doesNotMatch(routes, /Project\.model|projects\.routes/);
    assert.match(ctrl, /const LabEntry = require\('\.\.\/models\/LabEntry\.model'\);/);
});

console.log(`\n${passed} lab grid checks passed.`);

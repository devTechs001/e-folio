/**
 * Phase 33 — CV system expansion, the 3D welcome wordmark, the rebuilt
 * testimonials page and its automatic link to the reviews system.
 *
 * Node-only static checks: no framework, database, browser or network.
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

/* ------------------------------------------------------- 3D welcome tag --- */

check('the welcome wording stays the same and comes from the shared module', () => {
    const data = read('src/utils/aboutPageData.js');
    assert.match(data, /export const ABOUT_WELCOME_3D = 'Welcome to my portfolio';/);
    assert.match(data, /export const ABOUT_WELCOME = 'WELCOME TO MY PORTFOLIO';/);
    assert.match(data, /export const ABOUT_AVAILABILITY = 'Available for work';/);
    const about = read('src/pages/About.jsx');
    assert.match(about, /import WelcomeTag3D from '\.\.\/components\/WelcomeTag3D'/);
    assert.match(about, /<WelcomeTag3D text=\{ABOUT_WELCOME_3D\} as="h1" \/>/);
    // Exactly one h1 remains on the page (the wordmark); the name is an h2.
    const source = about.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.equal((source.match(/<h1[\s>]/g) || []).length, 0, 'the wordmark supplies the h1');
    // Phase 35 moved the name into the shared SectionHeading; it still renders
    // an h2 (the component's default level), so the page keeps one h1 only.
    assert.match(source, /<SectionHeading[\s\S]{0,240}className="about-heading"/);
    const heading = read('src/components/SectionHeading.jsx');
    assert.match(heading, /level = 2,/);
    assert.match(heading, /const Heading = `h\$\{level\}`;/);
});

check('the 3D tag is pure CSS, animated in view, and motion-safe', () => {
    const component = read('src/components/WelcomeTag3D.jsx');
    assert.match(component, /IntersectionObserver/);
    assert.match(component, /aria-label=\{text\}/);
    assert.match(component, /aria-hidden="true"/);
    assert.match(component, /welcome-3d__face--front/);
    assert.match(component, /welcome-3d__face--back/);
    assert.match(component, /welcome-3d__face--side/);
    // No WebGL dependency was added for this (the comment says so once).
    const code = component.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.doesNotMatch(code, /three|webgl|canvas/i);
    const css = read('src/styles/WelcomeTag3D.css');
    for (const token of [
        'perspective:', 'transform-style: preserve-3d', 'rotateY(',
        '@keyframes welcome3dTurn', '@keyframes welcome3dSheen',
        'prefers-reduced-motion', 'focus-visible', '.welcome-3d.is-live .welcome-3d__letter'
    ]) assert.ok(css.includes(token), `missing 3D style: ${token}`);
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{|\.about-blob\s*\{/);
    const pkg = json('package.json');
    assert.ok(!('three' in pkg.dependencies), 'no 3D rendering dependency was added');
});

/* --------------------------------------------------------- CV structure --- */

check('the shared CV contract lists every stored section', () => {
    assert.ok(exists('src/utils/cvSchema.js'));
    const src = read('src/utils/cvSchema.js');
    assert.match(src, /export const CV_SECTION_KEYS = /);
    for (const key of ['personalInfo', 'experience', 'education', 'skills', 'projects',
        'achievements', 'certifications', 'languages', 'links', 'settings']) {
        assert.ok(src.includes(`'${key}'`), `missing CV section: ${key}`);
    }
    assert.match(src, /export const reviewCv = /);
    assert.match(src, /export const summarizeCv = /);
    assert.match(src, /export const isCvUrl = /);
});

check('the model and the save endpoint accept the new sections', () => {
    const model = read('server/models/CurriculumVitae.js');
    for (const block of ['certifications: [{', 'languages: [{', 'links: [{']) {
        assert.ok(model.includes(block), `model missing ${block}`);
    }
    assert.match(model, /isPublished: \{ type: Boolean, default: false \}/);
    assert.match(model, /publishedSnapshot:/);
    const controller = read('server/controllers/cv.controller.js');
    assert.match(controller, /const normaliseSection = /);
    assert.match(controller, /\['experience', 'education', 'projects', 'achievements', 'certifications', 'languages', 'links'\]/);
    assert.match(controller, /const normalisePersonalInfo = /);
    assert.match(controller, /const normaliseSettings = /);
    assert.match(controller, /exports\.publishCV = /);
    assert.match(controller, /exports\.unpublishCV = /);
    assert.match(controller, /exports\.reviewCV = /);
    assert.match(controller, /exports\.importCV = /);
    // Versions capture every section through one helper.
    assert.match(controller, /const snapshotOf = cv =>/);
    assert.equal((controller.match(/snapshotOf\(cv\)/g) || []).length >= 2, true);
});

check('literal CV routes are registered before the version routes', () => {
    const routes = read('server/routes/cv.routes.js');
    const publish = routes.indexOf("router.post('/publish'");
    const versions = routes.indexOf("router.post('/versions'");
    assert.ok(publish > -1 && versions > publish, '/publish must precede /versions');
    for (const literal of ['/publish', '/unpublish', '/review', '/import']) {
        assert.ok(routes.includes(literal), `missing CV route: ${literal}`);
    }
    assert.match(routes, /router\.use\(auth\)/);
    assert.match(routes, /router\.use\(isAuthorized\)/);
});

check('an unpublished CV is not readable by visitors', () => {
    const routes = read('server/routes/public.routes.js');
    assert.match(routes, /const fetchPublicCv = async \(req, res\) =>/);
    assert.match(routes, /const viewerIsHolder = Boolean\(req\.user\) && String\(req\.user\._id\) === String\(user\._id\)/);
    assert.match(routes, /if \(!cv\.isPublished && !viewerIsHolder\)/);
    assert.match(routes, /res\.status\(404\)\.json\(\{ success: false, message: 'CV not found' \}\)/);
    assert.match(routes, /const document = cv\.isPublished && cv\.publishedSnapshot \? cv\.publishedSnapshot : cv/);
    assert.match(routes, /router\.get\('\/cv\/:username', optionalAuth, interactionLimiter, fetchPublicCv\)/);
    const middleware = read('server/middleware/auth.middleware.js');
    assert.match(middleware, /exports\.optionalAuth = async \(req, res, next\) =>/);
    assert.match(middleware, /catch \(error\) \{\s*\/\/ A public route stays public/);
});

/* ----------------------------------------------------------- CV editor --- */

check('the editor manages the new sections and keeps every existing one', () => {
    const src = read('src/components/dashboard/CVEditorStyled.jsx');
    for (const section of ['certifications', 'languages', 'links']) {
        assert.ok(src.includes(`render ${section}`) || src.includes(`'${section}'`), `missing tab: ${section}`);
        assert.ok(src.includes(`render${section.charAt(0).toUpperCase()}${section.slice(1)} = `)
            || src.includes(`'${section}'`), `missing renderer: ${section}`);
    }
    for (const kept of ['personal', 'experience', 'education', 'skills', 'projects', 'achievements', 'settings', 'preview']) {
        assert.ok(src.includes(`id: '${kept}'`), `existing tab lost: ${kept}`);
    }
    assert.match(src, /renderCertifications = \(\) => renderEntrySection\('certifications'/);
    assert.match(src, /case 'certifications': return cv\.certifications \|\| \[\]/);
    assert.match(src, /const mergeLoadedCv = data =>/);
});

check('the editor can publish, review, import and store a local draft', () => {
    const src = read('src/components/dashboard/CVEditorStyled.jsx');
    assert.match(src, /apiService\.publishCV\(\)/);
    assert.match(src, /apiService\.unpublishCV\(\)/);
    assert.match(src, /apiService\.reviewCV\(\)/);
    assert.match(src, /handleImportFile/);
    assert.match(src, /saveCvDraft\(user\?\._id \|\| user\?\.id, cv\)/);
    assert.match(src, /Draft saved on this device — not yet saved to your CV/);
    assert.match(src, /const renderReview = \(\) =>/);
    assert.match(src, /<CVPreview cv=\{cv\} \/>/);
    // A draft is offered, never applied silently.
    assert.match(src, /A draft saved in this browser exists/);
    assert.match(src, /not on your CV yet/);
});

check('local drafts are scoped per account and expire', () => {
    const src = read('src/utils/cvDraft.js');
    assert.match(src, /const KEY_PREFIX = 'e-folio:cv-draft:'/);
    assert.match(src, /const keyFor = userId =>/);
    assert.match(src, /MAX_AGE_MS = 1000 \* 60 \* 60 \* 24 \* 7/);
    assert.match(src, /export const clearCvDraft = /);
    assert.doesNotMatch(src, /sessionStorage|document\.cookie/);
});

check('one CV renderer serves the editor and the public page', () => {
    assert.ok(exists('src/components/CVPreview.jsx'));
    const preview = read('src/components/CVPreview.jsx');
    for (const token of ['cvp--${template}', 'cvp-header', 'cvp-contact', 'cvp-section',
        'Certifications', 'Languages', 'Achievements', 'Links', 'visible(']) {
        assert.ok(preview.includes(token), `missing renderer token: ${token}`);
    }
    assert.doesNotMatch(preview, /Dev Techs|devtechs842|John Doe/);
    const page = read('src/pages/UserCVPage.jsx');
    assert.match(page, /import CVPreview from '\.\.\/components\/CVPreview'/);
    assert.match(page, /<CVPreview cv=\{cv\} \/>/);
    assert.match(page, /encodeURIComponent\(username\)/);
    assert.match(page, /summarizeCv\(cv\)/);
    const css = read('src/styles/CVPreview.css');
    for (const token of ['.cvp', '.cvp--classic', '.cvp--minimal', '.cvp--creative',
        '.cvp--professional', 'prefers-reduced-motion', '@media print']) {
        assert.ok(css.includes(token), `missing CV preview style: ${token}`);
    }
});

/* ----------------------------------------------------- testimonials page --- */

check('the testimonials page keeps its data contract and preview rules', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /import sampleDataset from '\.\.\/data\/testimonialSamples\.json'/);
    assert.match(src, /const CACHE_KEY = 'public_testimonials_v2'/);
    assert.match(src, /cacheService\.delete\(LEGACY_CACHE_KEY\)/);
    assert.match(src, /const cached = previewMode \? null : cacheService\.get\(CACHE_KEY\)/);
    assert.match(src, /if \(previewMode && owner\)/);
    assert.match(src, /useState\(readPreviewFlag\)/);
    assert.match(src, /loadPublicSection\('testimonials'\)/);
    assert.match(src, /getSnapshotSection\('testimonials'\)/);
    assert.match(src, /const thumbnailFor = /);
    assert.match(src, /item\?\.thumbnail \|\| thumbnailOverrides\.byName\[item\?\.name\] \|\| item\?\.avatar/);
    assert.match(src, /isSampleTestimonial/);
    assert.doesNotMatch(src, /getFallbackTestimonials|picsum\.photos/);
    assert.ok((src.match(/testimonial-sample-badge/g) || []).length >= 3);
    assert.match(src, /document\.hidden/);
    assert.doesNotMatch(src, /apiService\.getTestimonials\(\)/);
});

check('the rebuilt page is one system with the shared design language', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /import '\.\.\/styles\/TestimonialsPage\.css'/);
    for (const token of ['tst-hero', 'tst-toolbar', 'tst-grid', 'tst-stats', 'tst-empty',
        'tst-modal', 'tst-segment', 'tst-source']) {
        assert.ok(src.includes(token), `missing layout token: ${token}`);
    }
    // No dead per-page controls were kept around.
    for (const gone of ['exportTestimonials', 'triggerConfetti', 'showConfetti', 'viewMode === \'carousel\' && (\\n                <div className="testimonial-carousel"']) {
        assert.ok(!src.includes(gone), `stale control still present: ${gone}`);
    }
    const css = read('src/styles/TestimonialsPage.css');
    for (const token of ['.tst-shell', '.tst-hero', '.tst-grid', '.tst-toolbar',
        '.tst-card', '.tst-source', 'prefers-reduced-motion', 'focus-visible',
        'grid-template-columns: repeat(auto-fill']) {
        assert.ok(css.includes(token), `missing page style: ${token}`);
    }
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
    // The preserved stylesheet still provides the primitives other checks use.
    const legacy = read('src/styles/Testimonials.css');
    assert.match(legacy, /\.testimonial-preview-banner/);
    assert.match(legacy, /\.testimonial-sample-badge/);
});

check('approved reviews join the page from the reviews system', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /loadApprovedReviews/);
    assert.match(src, /combineFeed\(curated, reviewFeed\.items\)/);
    assert.match(src, /FEED_KIND\.review/);
    const feed = read('src/utils/testimonialFeed.js');
    assert.match(feed, /apiService\.request\(`\/reviews\/public\?limit=\$\{safeLimit\}`\)/);
    assert.match(feed, /export const fromTestimonial = /);
    assert.match(feed, /export const fromReview = /);
    assert.match(feed, /export const combineFeed = /);
    assert.match(feed, /export const filterFeed = /);
    assert.match(feed, /export const sortFeed = /);
    // Pending reviews are never requested, only the public approved list.
    assert.doesNotMatch(feed, /\/reviews\?(?!.*public)|status: 'pending'/);
    assert.match(feed, /status: response\?\.success !== false/);
});

check('the three view modes each page correctly', () => {
    const src = read('src/pages/Testimonials.jsx');
    // Grid/list paginate by PAGE_SIZE; the carousel steps one at a time.
    assert.match(src, /const gridPages = Math.max\(1, Math\.ceil\(visible\.length \/ PAGE_SIZE\)\)/);
    assert.match(src, /const carouselPages = Math\.max\(1, visible\.length\)/);
    assert.match(src, /const activeSlide = Math\.min\(page, carouselPages\) - 1/);
    assert.match(src, /const paged = viewMode === 'carousel' \? visible : visible\.slice/);
    assert.match(src, /setPage\(current => \(current >= carouselPages \? 1 : current \+ 1\)\)/);
    assert.match(src, /gridPages > 1 && \(/);
    // A closed modal and a stopped carousel timer are released.
    assert.match(src, /if \(slideTimer\.current\) clearInterval\(slideTimer\.current\)/);
});

check('the page updates itself automatically, keeping the existing channels', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /socketService\.subscribePublicReviews\(refresh\)/);
    assert.match(src, /subscribeReviewsChanged\(refresh\)/);
    assert.match(src, /setInterval\(refresh, 30000\)/);
    assert.match(src, /visibilitychange/);
    assert.match(src, /window\.addEventListener\('online', onOnline\)/);
    assert.match(src, /flushReviewOutbox\(\)/);
    assert.match(src, /Updates automatically when a review is approved/);
    // The reviews page component is untouched and still works the same way.
    const reviews = read('src/components/PublicReviews.jsx');
    assert.match(reviews, /socketService\.subscribePublicReviews\(refresh\)/);
});

check('the page can open the real review form without losing the existing one', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /import ReviewForm from '\.\.\/components\/ReviewForm'/);
    assert.match(src, /<ReviewForm/);
    assert.match(src, /onSuccess=\{\(\) => \{ setShowForm\(false\); loadFeed\(\{ quiet: true \}\); \}\}/);
    assert.ok(exists('src/components/ReviewForm.jsx'));
    assert.ok(exists('src/components/ReviewFloatingButton.jsx'));
    const landing = read('src/pages/LandingPage.jsx');
    assert.match(landing, /<Testimonials \/>/);
    assert.match(landing, /<ReviewFloatingButton \/>/);
});

/* -------------------------------------------- reviews ↔ testimonials sync --- */

check('an approved review is mirrored into the curated testimonials', () => {
    const controller = read('server/controllers/reviews.controller.js');
    assert.match(controller, /const Testimonial = require\('\.\.\/models\/Testimonial\.model'\)/);
    assert.match(controller, /const syncTestimonialForReview = async \(review, action = 'approved'\) =>/);
    assert.match(controller, /await Testimonial\.deleteMany\(\{ sourceReviewId: review\._id \}\)/);
    assert.match(controller, /await Testimonial\.findOne\(\{ sourceReviewId: review\._id \}\)/);
    assert.match(controller, /source: 'api'/);
    // Both single and bulk moderation paths call the mirror.
    assert.ok((controller.match(/syncTestimonialForReview\(review,/g) || []).length >= 2);
    const model = read('server/models/Testimonial.model.js');
    assert.match(model, /sourceReviewId: \{/);
    assert.match(model, /testimonialSchema\.index\(\{ sourceReviewId: 1 \}, \{ unique: true, sparse: true \}\)/);
    // The public testimonial projection no longer leaks contact details.
    const publicController = read('server/controllers/public-testimonials.controller.js');
    assert.doesNotMatch(publicController, /email website linkedin/);
    assert.match(publicController, /avatar thumbnail rating content featured visible date source tags project/);
});

check('a deleted review cannot leave a stale testimonial behind', () => {
    const controller = read('server/controllers/reviews.controller.js');
    assert.match(controller, /syncTestimonialForReview\(review, status === 'approved' && review\.isPublic !== false \? 'approved' : 'removed'\)/);
    // Re-syncing keeps the owner's own featuring decision.
    assert.match(controller, /const \{ featured, \.\.\.rest \} = fields;/);
});

/* ---------------------------------------------------- preserved surfaces --- */

check('project cards, CV look files and saved sample data are untouched', () => {
    const protectedFiles = [
        'src/components/ProjectCard.jsx',
        'src/styles/ProjectCard.css',
        'src/pages/ProjectCard.jsx',
        'src/pages/ProjectModal.jsx',
        'src/styles/CVComponent.css',
        'public/CV2.pdf',
        'src/data/labSamples.json',
        'src/data/testimonialSamples.json',
        'src/components/dashboard/TestimonialSamplesPanel.jsx',
        'server/scripts/seedTestimonialSamples.js'
    ];
    for (const file of protectedFiles) assert.ok(exists(file), `missing protected file: ${file}`);
    const snapshot = json('src/data/publicSnapshot.json');
    assert.equal(snapshot.sections.projects.projects.length, 16);
    for (const project of snapshot.sections.projects.projects) {
        assert.ok(project.likes >= 600 && project.views >= 600, `${project.title} lost its counters`);
    }
    assert.equal(json('src/data/testimonialSamples.json').samples.length, 8);
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    // The CV component used by /cv keeps its own markup and stylesheet.
    const component = read('src/components/CVComponent.jsx');
    assert.match(component, /import '\.\.\/styles\/CVComponent\.css'/);
    assert.match(component, /title: "IT Assistant Manager \(Contract\)"/);
});

check('no secret, live probe or fabricated record was introduced', () => {
    const text = [
        'src/pages/Testimonials.jsx',
        'src/utils/testimonialFeed.js',
        'src/components/CVPreview.jsx',
        'src/components/WelcomeTag3D.jsx',
        'src/pages/UserCVPage.jsx',
        'src/utils/cvSchema.js',
        'src/utils/cvDraft.js',
        'src/components/dashboard/CVEditorStyled.jsx',
        'server/controllers/cv.controller.js',
        'server/controllers/reviews.controller.js',
        'server/routes/public.routes.js',
        'server/models/CurriculumVitae.js'
    ].map(read).join('\n');
    assert.doesNotMatch(text, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(text, /http:\/\/localhost/);
    assert.doesNotMatch(text, /mockReviews|mockAnalytics|John Doe|Jane Smith|Alex Johnson/);
    assert.doesNotMatch(text, /nmap|sqlmap|pentest|exploit/i);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:cv-system-testimonials'], /cv-system-testimonials\.test\.mjs/);
        assert.match(scripts.test, /cv-system-testimonials\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ag\./);
    assert.match(report, /Phase 33/);
});

console.log(`\n${passed} CV system / 3D welcome / testimonials-review regression checks passed.`);

/**
 * Regression checks: public review submission ↔ server ↔ dashboard (phase 20).
 * Node-only static checks — no DB, no network, no browser, no external service.
 * Confidential: local checkout only.
 *
 * These prove the wiring, not live socket/Mongo behaviour (unavailable here).
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

const controller = () => read('server/controllers/reviews.controller.js');
const form = () => read('src/components/ReviewForm.jsx');

/* --------------------------- server: reliability --------------------------- */

check('optional fields are normalised before any database write', () => {
    const src = controller();
    assert.match(src, /const normaliseReviewInput = body =>/);
    assert.match(src, /REVIEW_CATEGORY_KEYS = \['design', 'functionality', 'performance', 'support'\]/);
    assert.ok(src.includes("/^[0-9a-fA-F]{24}$/.test(String(source.projectId || ''))"),
        'slug project ids must be rejected before Review.create');
    assert.match(src, /Number\.isFinite\(value\) \? Math\.min\(5, Math\.max\(0, Math\.round\(value\)\)\) : 0/);
    assert.match(src, /Number\.isInteger\(rating\)/);
});

check('a saved review always answers success before side effects run', () => {
    const src = controller();
    const created = src.indexOf('const review = await Review.create(');
    const answered = src.indexOf('res.status(201).json(');
    const effects = src.indexOf('void Promise.allSettled(');
    assert.ok(created > -1 && answered > created && effects > answered,
        'response must precede notification work');
    assert.match(src, /const safeSideEffect = async \(label, task\) =>/);
    assert.match(src, /void Promise\.allSettled\(\[/);
    // No unguarded post-save owner lookup / activity log left in createReview.
    const block = src.slice(src.indexOf('exports.createReview'), src.indexOf('// Get reviews with filtering'));
    assert.doesNotMatch(block, /await ActivityLog\.create\(/);
    assert.doesNotMatch(block, /const owner = await User\.findOne\(\{ role: 'owner' \}\);\n\s*if \(owner\) \{\n\s*try/);
});

check('submission and moderation broadcasts carry ids/status only', () => {
    const src = controller();
    assert.match(src, /emitPublicEvent\('review:submitted', \{\s*reviewId: String\(review\._id\),\s*status: review\.status/);
    assert.match(src, /emitPublicEvent\('review:changed', \{ action, reviewId: String\(reviewId\), status \}/);
    assert.equal((src.match(/notifyReviewChange\(req,/g) || []).length, 7);
    const broadcaster = read('server/utils/projectEvents.js');
    assert.match(broadcaster, /const emitPublicEvent = \(event, payload = \{\}, ioInstance\) =>/);
    assert.match(broadcaster, /!event\.startsWith\('review:'\)/);
    assert.match(broadcaster, /io\.of\(PUBLIC_PROJECTS_NAMESPACE\)\.emit\(event, data\)/);
    assert.match(broadcaster, /io\.emit\(event, data\)/);
});

check('the owner notification now uses a room that actually exists', () => {
    const src = controller();
    assert.match(src, /global\.notificationsRealtime\?\.emitToUser\(owner\._id, 'new_review'/);
    assert.doesNotMatch(src, /io\.to\(`user_\$\{owner\._id\}`\)/);
    const routes = read('server/routes/reviews.routes.js');
    assert.match(routes, /router\.post\('\/submit', rateLimiter\(5\)/);
    assert.match(routes, /router\.get\('\/public', reviewsController\.getPublicReviews\)/);
});

/* --------------------------- client: the form ------------------------------ */

check('the detailed star widget now emits a number, not a nested object', () => {
    const src = form();
    assert.match(src, /onClick=\{\(\) => onChange\(star\)\}/);
    assert.doesNotMatch(src, /onChange\(category \?/);
    assert.match(src, /const StarRating = \(\{ value, onChange, size = 32, label = '' \}\)/);
    assert.match(src, /support: 0/);
    assert.doesNotMatch(src, /content: 0/);
});

check('the form sends only persisted, schema-valid fields', () => {
    const src = form();
    assert.match(src, /import \{ submitReview, flushReviewOutbox, subscribeReviewsChanged \}/);
    assert.match(src, /const payload = \{[\s\S]*?projectId: \/\^\[0-9a-fA-F\]\{24\}\$\//);
    assert.doesNotMatch(src, /\.\.\.formData,\s*attachments/);
    assert.match(src, /if \(!result\.success\)/);
    assert.match(src, /showSuccess\(result\.message\)/);
    assert.match(src, /window\.addEventListener\('online', retry\)/);
});

check('the floating form validates the same minimum comment length', () => {
    const src = read('src/components/ReviewFloatingButton.jsx');
    assert.match(src, /formData\.comment\.trim\(\)\.length < 10/);
    assert.match(src, /import \{ submitReview, flushReviewOutbox \}/);
    assert.match(src, /const result = await submitReview\(/);
    assert.match(src, /success\(result\.message\)/);
    assert.doesNotMatch(src, /apiService\.createReview/);
});

/* ------------------------------ honest outbox ------------------------------ */

check('an offline review is queued honestly and never claimed as submitted', () => {
    assert.ok(exists('src/utils/reviewOutbox.js'));
    const src = read('src/utils/reviewOutbox.js');
    assert.match(src, /queued: true/);
    assert.match(src, /Saved on this device — not yet submitted/);
    assert.match(src, /const isOfflineFailure = error =>/);
    assert.match(src, /export const flushReviewOutbox = \(\) =>/);
    assert.match(src, /let flushInFlight = null/);
    assert.doesNotMatch(src, /getSnapshotSection|publicSnapshot|setReviews\(/);
    // Queued items are real visitor input, stored locally only.
    assert.match(src, /localStorage\.setItem\(REVIEW_OUTBOX_KEY/);
    assert.match(src, /publishReviewsChanged\(\)/);
});

check('outbox signals carry no review text, name or email', () => {
    const src = read('src/utils/reviewOutbox.js');
    const publish = src.slice(src.indexOf('export const publishReviewsChanged'), src.indexOf('export const subscribeReviewsChanged'));
    assert.doesNotMatch(publish, /comment|name|email|payload/);
    assert.match(publish, /String\(Date\.now\(\)\)/);
    assert.match(src, /BroadcastChannel/);
    assert.match(src, /window\.addEventListener\('storage', onStorage\)/);
});

/* --------------------------- client: sync paths ---------------------------- */

check('the public review list refreshes on broadcast, poll and tab visibility', () => {
    const src = read('src/components/PublicReviews.jsx');
    assert.match(src, /socketService\.subscribePublicReviews\(refresh\)/);
    assert.match(src, /subscribeReviewsChanged\(refresh\)/);
    assert.match(src, /setInterval\(refresh, 30000\)/);
    assert.match(src, /document\.hidden/);
    assert.match(src, /visibilitychange/);
    assert.match(src, /window\.addEventListener\('online', onOnline\)/);
    assert.match(src, /getPublicReviews\(/);
    const socket = read('src/services/socket.service.js');
    assert.match(socket, /const events = \['review:changed', 'review:submitted'\]/);
    assert.match(socket, /events\.forEach\(event => socket\.on\(event, callback\)\)/);
});

check('the owner dashboard listens on the correct namespaces and polls', () => {
    const src = read('src/components/dashboard/ReviewsManager.jsx');
    assert.match(src, /on\('review:submitted', refresh\)/);
    assert.match(src, /on\('review:changed', refresh\)/);
    assert.match(src, /socketService\.onNotificationEvent\('new_review', handleNewReview\)/);
    assert.match(src, /socketService\.offNotificationEvent\('new_review', handleNewReview\)/);
    assert.match(src, /setInterval\(refresh, 30000\)/);
    assert.match(src, /loadReviews\(true\)/);
    assert.doesNotMatch(src, /setReviews\(prev => \[review, ...prev\]\)/);
});

/* ------------------------------- preserving -------------------------------- */

check('owner-only moderation, public routes and the saved testimonials stay intact', () => {
    const routes = read('server/routes/reviews.routes.js');
    assert.match(routes, /\.get\(auth, isOwner, reviewsController\.getReviews\)/);
    assert.match(routes, /\.post\(auth, isOwner, reviewsController\.createReview\)/);
    const src = controller();
    for (const token of ['John Doe', 'Jane Smith', 'Alex Johnson', 'mockReviews', 'mockAnalytics']) {
        assert.ok(!src.includes(token), `fabricated token still present: ${token}`);
    }
    assert.match(src, /meta: \{ populated: false \}/);
    assert.equal(json('src/data/publicSnapshot.json').sections.testimonials.count, 8);
    assert.match(read('src/pages/Testimonials.jsx'), /loadPublicSection\('testimonials'\)/);
    assert.equal(
        json('src/data/testimonialSamples.json').previewUrl,
        'https://net-gate-portal.netlify.app/'
    );
});

check('no secret, external write or runtime service call was introduced', () => {
    for (const file of [
        'server/controllers/reviews.controller.js',
        'server/utils/projectEvents.js',
        'src/utils/reviewOutbox.js',
        'src/components/ReviewForm.jsx',
        'src/components/ReviewFloatingButton.jsx',
        'src/components/PublicReviews.jsx',
        'src/components/dashboard/ReviewsManager.jsx',
        'src/services/socket.service.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /http:\/\/localhost/);
    }
});

/* --------------------------------- wiring ---------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:review-submission'], /review-submission\.test\.mjs/);
        assert.match(pkg.scripts.test, /review-submission\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3t\./);
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} review-submission regression checks passed.`);

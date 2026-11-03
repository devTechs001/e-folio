/**
 * Regression tests for the collaboration and review systems.
 * Node-only static checks: no framework, no database, no network.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* ---------------------------------------------------------------- auth --- */

check('review collection reads and moderation are owner-only', () => {
    const src = read('server/routes/reviews.routes.js');
    assert.match(src, /router\.route\('\/'\)\s*\n\s*\.get\(auth, isOwner,/);
    assert.match(src, /router\.route\('\/:id'\)\s*\n\s*\.get\(auth, isOwner,/);
    assert.doesNotMatch(src, /\.get\(auth, reviewsController\./);
    // Anonymous endpoints that must remain open.
    assert.match(src, /router\.get\('\/public', reviewsController\.getPublicReviews\)/);
    assert.match(src, /router\.get\('\/featured', reviewsController\.getFeaturedReviews\)/);
    assert.match(src, /router\.post\('\/submit', rateLimiter\(5\)/);
});

check('every review mutation that is not public requires isOwner', () => {
    const src = read('server/routes/reviews.routes.js');
    const publicPaths = ['/submit', '/:id/like'];
    const offenders = src.split('\n').filter(line => {
        const m = line.match(/router\.(post|put|patch|delete)\(\s*'([^']+)'/);
        return m && !publicPaths.includes(m[2]) && !line.includes('isOwner');
    });
    assert.deepEqual(offenders, []);
});

check('invite validation and acceptance are anonymous but rate limited', () => {
    const src = read('server/routes/collaborators.routes.js');
    const validateAt = src.indexOf("router.get('/invite/validate/:token'");
    const acceptAt = src.indexOf("router.post('/invite/accept/:token'");
    const authAt = src.indexOf('router.use(auth)');
    assert.ok(validateAt > -1 && acceptAt > -1 && authAt > -1);
    assert.ok(validateAt < authAt, 'validate must be declared before router.use(auth)');
    assert.ok(acceptAt < authAt, 'accept must be declared before router.use(auth)');
    assert.match(src, /router\.get\('\/invite\/validate\/:token', rateLimiter\(/);
    assert.match(src, /router\.post\('\/invite\/accept\/:token', rateLimiter\(/);
    assert.match(src, /router\.use\(isOwner\)/);
});

check('collaboration collaborator/activity listings are owner-only', () => {
    for (const file of ['server/routes/collaboration.routes.js', 'server/routes/collaboration-requests.routes.js']) {
        const src = read(file);
        for (const p of ['/collaborators', '/invites/pending', '/activity']) {
            const line = src.split('\n').find(l => l.includes(`'${p}'`) && l.includes('router.get'));
            assert.ok(line && line.includes('isOwner'), `${file} ${p} must require isOwner`);
        }
    }
});

check('applicant documents are outside the public static root', () => {
    const server = read('server/server.js');
    assert.doesNotMatch(server, /uploads\/collaboration-requests/);
    assert.match(server, /app\.use\('\/uploads', express\.static/);
    const middleware = read('server/middleware/upload.middleware.js');
    assert.match(middleware, /PRIVATE_ROOT/);
    assert.match(middleware, /storageFor\('collaboration-requests', PRIVATE_ROOT\)/);
    assert.match(read('.gitignore'), /server\/private\/uploads\//);
});

check('applicant documents are served only through an owner-authenticated route', () => {
    for (const file of ['server/routes/collaboration.routes.js', 'server/routes/collaboration-requests.routes.js']) {
        const line = read(file).split('\n').find(l => l.includes("'/files/:filename'"));
        assert.ok(line && line.includes('auth, isOwner'), `${file} must guard /files/:filename`);
    }
    const controller = read('server/controllers/collaboration.controller.js');
    assert.match(controller, /exports\.downloadRequestFile/);
    assert.match(controller, /res\.sendFile\(filePath\)/);
    assert.match(controller, /urlFor\(files\[0\]\.filename\)/);
    assert.doesNotMatch(controller, /path: f\.path/);
});

check('workspace site-wide listing is owner-only and scoped', () => {
    const routes = read('server/routes/workspace.routes.js');
    assert.match(routes, /router\.get\('\/all', isOwner,/);
    const controller = read('server/controllers/workspace.controller.js');
    assert.doesNotMatch(controller, /req\.params\.id/);
    assert.match(controller, /const \{ workspaceId \} = req\.params/);
    assert.match(controller, /req\.user\?\.role !== 'owner'/);
});

check('workspace tasks and analytics enforce membership', () => {
    const src = read('server/controllers/workspace.controller.js');
    const guards = (src.match(/isWorkspaceMember\(workspace, req\.user\?\._id \|\| req\.user\?\.id\)/g) || []).length;
    assert.ok(guards >= 3, `expected >= 3 new membership guards, found ${guards}`);
});

/* ------------------------------------------------------------ integrity --- */

check('review controller never serves fabricated reviews or analytics', () => {
    const src = read('server/controllers/reviews.controller.js');
    for (const token of ['John Doe', 'Jane Smith', 'Alex Johnson', 'mockReviews', 'mockAnalytics']) {
        assert.ok(!src.includes(token), `fabricated token still present: ${token}`);
    }
    assert.match(src, /meta: \{ populated: false \}/);
    assert.match(src, /success: false/);
    assert.doesNotMatch(src, /error: error\.message/);
});

check('public testimonial page uses live data, then the saved local copy', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.doesNotMatch(src, /getFallbackTestimonials/);
    assert.doesNotMatch(src, /Sarah Johnson|unsplash\.com/);
    assert.match(src, /loadPublicSection\('testimonials'\)/);
    assert.match(src, /getSnapshotSection\('testimonials'\)/);
    assert.doesNotMatch(src, /loadError|temporarily unavailable/);
    const snapshot = JSON.parse(read('src/data/publicSnapshot.json'));
    assert.equal(snapshot.sections.testimonials.count, 8);
});

check('testimonial manager uses the owner list endpoint', () => {
    const src = read('src/components/dashboard/TestimonialManager.jsx');
    assert.match(src, /apiService\.getAllTestimonials\(/);
    assert.doesNotMatch(src, /apiService\.getTestimonials\(/);
});

check('project manager no longer falls back to seeded projects or random photos', () => {
    const src = read('src/components/dashboard/ProjectManagerEnhanced.jsx');
    assert.doesNotMatch(src, /getFallbackProjects|picsum\.photos|Math\.random\(/);
    assert.match(src, /setProjects\(\[\]\)/);
});

check('email simulation reports a failure, not a fake delivery', () => {
    for (const file of ['server/utils/email.js', 'server/services/email.service.js']) {
        const src = read(file);
        assert.match(src, /success: false,\s*\n?\s*simulated: true/);
        assert.doesNotMatch(src, /success: true, simulated: true/);
    }
});

/* --------------------------------------------------------------- invites --- */

check('approving a request creates a hashed Invite, not a raw token on the request', () => {
    const src = read('server/controllers/collaboration.controller.js');
    assert.match(src, /await Invite\.create\(\{/);
    assert.match(src, /crypto\.createHash\('sha256'\)\.update\(rawToken\)\.digest\('hex'\)/);
    assert.match(src, /\/accept-invite\//);
    assert.doesNotMatch(src, /\/register\?token=/);
    assert.doesNotMatch(src, /request\.inviteToken = inviteToken/);
    assert.match(src, /request\.inviteToken = undefined/);
    assert.doesNotMatch(src, /507f1f77bcf86cd799439011/);
});

check('resend reissues a fresh hashed invite and retires old pending ones', () => {
    const src = read('server/controllers/collaboration.controller.js');
    const start = src.indexOf('exports.resendInvite');
    const body = src.slice(start, src.indexOf('// Get request activity', start));
    assert.match(body, /Invite\.updateMany\(/);
    assert.match(body, /issueApprovalInvite\(/);
    assert.match(body, /inviteLink: link/);
    // Legacy tokens are cleared, never read back and reused.
    assert.doesNotMatch(body, /if \(!request\.inviteToken\)/);
    assert.match(body, /request\.inviteToken = undefined/);
});

check('bulk approval uses a working base URL and reports email delivery', () => {
    const src = read('server/controllers/collaboration.controller.js');
    const start = src.indexOf('exports.bulkApproveRequests');
    const body = src.slice(start, src.indexOf('// Bulk reject', start));
    assert.doesNotMatch(body, /process\.env\.FRONTEND_URL\}/);
    assert.match(body, /email: \{ undelivered \}/);
    assert.match(body, /issueApprovalInvite\(/);
});

check('acceptInvite hashes the token the same way approval does', () => {
    const src = read('server/controllers/collaborators.controller.js');
    const start = src.indexOf('exports.acceptInvite');
    const body = src.slice(start);
    assert.match(body, /crypto\s*\.createHash\('sha256'\)/);
    assert.match(body, /Invite\.findOne\(\{/);
    assert.match(body, /code: 'USER_EXISTS'/);
    assert.doesNotMatch(body, /error: error\.message/);
});

check('frontend has an accept-invite page wired to the anonymous endpoints', () => {
    const app = read('src/App.jsx');
    assert.match(app, /path="\/accept-invite\/:token"/);
    assert.match(app, /lazy\(\(\) => import\('\.\/pages\/AcceptInvite'\)\)/);
    assert.ok(exists('src/pages/AcceptInvite.jsx'));
    const page = read('src/pages/AcceptInvite.jsx');
    assert.match(page, /apiService\.validateInviteToken\(/);
    assert.match(page, /apiService\.acceptInvite\(/);
    const api = read('src/services/api.service.js');
    assert.match(api, /async getAllTestimonials\(/);
    assert.match(api, /async validateInviteToken\(/);
    assert.match(api, /async acceptInvite\(/);
});

check('api service has no duplicate methods or fake review success fallbacks', () => {
    const src = read('src/services/api.service.js');
    const names = [...src.matchAll(/^    async ([A-Za-z0-9_]+)\s*\(/gm)].map(m => m[1]);
    assert.equal(new Set(names).size, names.length, 'duplicate apiService method names');
    assert.doesNotMatch(src, /Featured reviews unavailable'\);\s*\n\s*return \{ success: true/);
    assert.doesNotMatch(src, /Reviews count unavailable'\);\s*\n\s*return \{ success: true/);
});

/* ---------------------------------------------------------------- routers --- */

check('both collaboration routers expose identical guarded route declarations', () => {
    const declarations = file => read(file).split('\n')
        .filter(line => /^\s*(router\.(get|post|put|patch|delete)\(|router\.route\()/.test(line))
        .map(line => line.trim());
    const a = declarations('server/routes/collaboration.routes.js');
    const b = declarations('server/routes/collaboration-requests.routes.js');
    assert.deepEqual(a, b, 'the two collaboration routers have drifted');
    assert.ok(a.some(line => line.includes("'/upload'") && line.includes('collaborationUpload')));
    assert.ok(a.some(line => line.includes("'/bulk/approve'")));
    assert.ok(a.some(line => line.includes("'/requests/bulk/approve'")));
});

check('CSV exports use one declared parser package', () => {
    for (const file of [
        'server/controllers/reviews.controller.js',
        'server/controllers/collaboration.controller.js',
        'server/controllers/collaborators.controller.js',
        'server/controllers/email.controller.js',
        'server/controllers/testimonial.controller.js',
        'server/services/ExportService.js'
    ]) {
        assert.match(read(file), /@json2csv\/plainjs/, `${file} must use @json2csv/plainjs`);
    }
});

console.log(`\n${passed} collaboration/review regression checks passed.`);

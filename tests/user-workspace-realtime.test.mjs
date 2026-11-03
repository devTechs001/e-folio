/**
 * Regression checks: enhanced NEX Store link, richer CV/portfolio/account UI,
 * and private real-time notifications.
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

/* -------------------------------------- enhanced NEX Store link ---------- */

check('the NEX Store destination is a single unchanged canonical URL', () => {
    assert.ok(exists('src/utils/nexStore.js'));
    const src = read('src/utils/nexStore.js');
    assert.match(src, /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
    assert.match(src, /nexStoreAnchorProps/);
    assert.match(src, /rel: 'noopener noreferrer'/);
    assert.match(src, /referrerPolicy: 'no-referrer'/);
    // No new/replacement external destinations were introduced.
    const urls = src.match(/https:\/\/[^\s'"]+/g) || [];
    assert.deepEqual([...new Set(urls)], ['https://nex-store-pro.netlify.app/']);
});

check('both projects pages render the shared enhanced link component', () => {
    for (const file of ['src/pages/Projects.jsx', 'src/components/Projects.jsx']) {
        const src = read(file);
        assert.match(src, /NexStoreCard/, `${file} must use the enhanced component`);
        assert.doesNotMatch(src, /href="https:\/\/nex-store-pro\.netlify\.app\/"/,
            `${file} must not keep a duplicated hardcoded anchor`);
        assert.doesNotMatch(src, /net-gate-portal\.netlify\.app/, `${file} must not touch NetGate links`);
    }
    const card = read('src/components/NexStoreCard.jsx');
    for (const feature of ['nexStoreAnchorProps', 'QRCode.toDataURL', 'navigator.clipboard', 'navigator.share', 'navigator.onLine']) {
        assert.ok(card.includes(feature), `NexStoreCard must implement ${feature}`);
    }
    assert.doesNotMatch(card, /localhost|http:\/\/127\.0\.0\.1/);
    assert.ok(exists('src/styles/NexStoreCard.css'));
});

/* -------------------------------------- private real-time notifications -- */

check('an authenticated per-user notification namespace is registered', () => {
    assert.ok(exists('server/socket/notifications.handler.js'));
    const handler = read('server/socket/notifications.handler.js');
    assert.match(handler, /io\.of\('\/notifications'\)/);
    assert.match(handler, /security\.verifyToken\(token\)/);
    assert.match(handler, /socket\.join\(room\)/);
    assert.match(handler, /namespace\.to\(`user:\$\{String\(userId\)\}`\)\.emit/);
    assert.match(handler, /notification:new/);
    assert.match(handler, /Notification\.create/);
    assert.match(read('server/server.js'), /registerNotificationsRealtime\(io\)/);
});

check('account, CV and portfolio events create real notifications', () => {
    assert.match(read('server/routes/auth.routes.js'), /publishUserNotification\(user\._id/);
    assert.match(read('server/routes/auth.routes.js'), /New account created/);
    assert.match(read('server/controllers/cv.controller.js'), /CV workspace created/);
    assert.match(read('server/controllers/cv.controller.js'), /CV saved/);
    const portfolio = read('server/controllers/portfolioEditor.controller.js');
    assert.match(portfolio, /Portfolio workspace created/);
    assert.match(portfolio, /Portfolio published/);
    assert.match(portfolio, /Portfolio unpublished/);
    assert.match(portfolio, /isPublished: Boolean\(config\.isPublished\)/);
    assert.match(portfolio, /publishedAt: config\.publishedAt \|\| null/);
});

check('notification REST endpoints are targeted, owner-guarded and state-aware', () => {
    const controller = read('server/controllers/notifications.controller.js');
    const routes = read('server/routes/notifications.routes.js');
    assert.match(routes, /router\.post\('\/user\/:userId', isOwner, createNotificationForUser\)/);
    assert.match(controller, /createNotificationForUser/);
    assert.match(controller, /mongoose\.isValidObjectId\(targetUserId\)/);
    assert.match(controller, /User\.findById\(targetUserId\)/);
    assert.doesNotMatch(controller, /req\.app\.get\('io'\)\.emit\('notification'/,
        'root-namespace broadcast leaks notifications to every client');
    for (const action of ['read', 'read-all', 'delete', 'delete-all', 'dismiss']) {
        assert.ok(controller.includes(`action: '${action}'`), `missing ${action} update event`);
    }
    assert.match(controller, /publishNotificationUpdate/);
});

check('the client notification stream has an honest polling fallback', () => {
    const socket = read('src/services/socket.service.js');
    for (const name of ['connectNotifications', 'disconnectNotifications', 'onNotificationEvent', 'offNotificationEvent', 'subscribeNotificationStatus', 'isNotificationsConnected']) {
        assert.ok(socket.includes(name), `socket service must expose ${name}`);
    }
    assert.match(socket, /io\(`\$\{SOCKET_URL\}\/notifications`/);
    assert.match(socket, /notificationRefs/);
    assert.match(read('src/contexts/SocketContext.jsx'), /disconnectNotifications\(true\)/);

    const hook = read('src/hooks/useWorkspaceNotifications.js');
    assert.match(hook, /getAllNotifications/);
    assert.match(hook, /getUnreadNotifications/);
    assert.match(hook, /notification:new/);
    assert.match(hook, /notification:updated/);
    assert.match(hook, /POLL_INTERVAL_MS = 30000/);
    assert.match(hook, /if \(!userId \|\| live\) return undefined/);
    assert.match(hook, /setLive\(Boolean\(state\?\.connected\)\)/);
    assert.doesNotMatch(hook, /Math\.random|setTimeout\(\(\) => .*notification/);
});

/* -------------------------------------- enhanced workspace UI ------------ */

check('the User Workspaces page exists and is routed for owners and users', () => {
    assert.ok(exists('src/components/dashboard/UserWorkspaceManager.jsx'));
    const dashboard = read('src/pages/Dashboard.jsx');
    assert.match(dashboard, /\/dashboard\/user-workspaces/);
    assert.match(dashboard, /LazyUserWorkspaceManager/);
    assert.match(dashboard, /roles: \['owner', 'user'\]/);
    assert.match(read('src/components/dashboard/Profile.jsx'), /to="\/dashboard\/user-workspaces"/);
});

check('the workspace UI uses real APIs for every enhanced feature', () => {
    const ui = read('src/components/dashboard/UserWorkspaceManager.jsx');
    const utils = read('src/utils/userWorkspace.js');
    const api = read('src/services/api.service.js');
    for (const needle of [
        'createAccountForAnotherUser', 'ensureUserWorkspace', 'buildWorkspaceChecklist',
        'inspectUserWorkspace', 'notifyWorkspaceUser', 'downloadCVExport',
        'publishUserPortfolio', 'unpublishUserPortfolio', 'useWorkspaceNotifications'
    ]) {
        assert.ok(ui.includes(needle), `UI must use ${needle}`);
    }
    for (const needle of ['getAdminUsers', 'applyPortfolioTemplate', 'getPortfolioVersions', 'getCVVersions', 'createCVVersion']) {
        assert.ok(ui.includes(needle), `UI must call ${needle}`);
    }
    for (const needle of ['getAdminUsers', 'getPublicPortfolio', 'exportCV', 'getPortfolioTemplates', 'applyPortfolioTemplate', 'notifyUser']) {
        assert.match(api, new RegExp(`async ${needle}\\(`), `apiService must expose ${needle}`);
    }
    assert.match(utils, /buildWorkspaceChecklist/);
    assert.match(utils, /apiService\.register/);
    assert.match(utils, /getPublicCV\(slug\)/);
    assert.doesNotMatch(utils, /localhost|Math\.random/);
});

check('the workspace UI reports state honestly instead of fabricating it', () => {
    const ui = read('src/components/dashboard/UserWorkspaceManager.jsx');
    const utils = read('src/utils/userWorkspace.js');
    assert.match(ui, /Polling \(30s\)|Live notifications/);
    assert.match(ui, /No users returned|Owner access required/);
    assert.match(ui, /No CV versions returned|No portfolio versions returned/);
    assert.match(ui, /No notifications yet/);
    assert.match(utils, /No sample values and no invented counts/);
    assert.doesNotMatch(utils, /sampleData|mockData|demoUser/);
    assert.doesNotMatch(ui, /localhost:5000|VITE_API_URL/);
});

check('real-time notification composer is owner-only and targets a real user', () => {
    const ui = read('src/components/dashboard/UserWorkspaceManager.jsx');
    const utils = read('src/utils/userWorkspace.js');
    assert.match(ui, /owner && \(/);
    assert.match(ui, /sendNotificationToUser/);
    assert.match(utils, /apiService\.notifyUser\(userId, payload\)/);
    assert.match(ui, /type: 'workspace'/);
});

check('public CV/portfolio pages still use relative real APIs', () => {
    for (const [file, endpoint] of [
        ['src/pages/UserCVPage.jsx', '/public/cv/'],
        ['src/pages/UserPortfolioPage.jsx', '/public/portfolio/']
    ]) {
        const src = read(file);
        assert.ok(src.includes(endpoint));
        assert.doesNotMatch(src, /localhost:5000/);
        assert.match(src, /encodeURIComponent\(username\)/);
    }
    assert.match(read('src/utils/userWorkspace.js'), /publicUserLinks/);
});

/* -------------------------------------- project links untouched --------- */

check('NetGate / project links were left exactly as they were', () => {
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, 'https://net-gate-portal.netlify.app/');
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    const testimonials = json('src/data/testimonialSamples.json');
    assert.equal(testimonials.legacyProjectUrl, 'https://e-folio-pro.netlify.app');
    assert.equal(testimonials.samples.length, 8);
    const seeder = read('server/scripts/seedTestimonialSamples.js');
    assert.match(seeder, /const PROJECT_URL = dataset\.previewUrl/);
    assert.match(seeder, /website: PROJECT_URL/);
});

console.log(`\n${passed} enhanced workspace / realtime / NEX Store regression checks passed.`);

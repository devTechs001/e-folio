'use strict';
/**
 * Owner-only data sources for the Security Audit and Resources dashboard pages.
 *
 * Everything here reads the local checkout only. No network calls, no database
 * writes, no live probing, and no secret VALUES are returned — only booleans,
 * counts, file metadata and static-audit findings.
 */
const fs = require('fs');
const path = require('path');
const security = require('../config/security');
const { runAudit } = require('../scripts/security-audit');

const ROOT = path.resolve(__dirname, '../..');
const AUDIT_TTL_MS = 60 * 1000;
let auditCache = null;

const readSource = rel => {
    try {
        return fs.readFileSync(path.join(ROOT, rel), 'utf8');
    } catch {
        return '';
    }
};

/* ----------------------------------------------------------- audit ------ */

const getSecurityAudit = async (req, res) => {
    try {
        const force = req.query.refresh === '1' || req.query.refresh === 'true';
        const now = Date.now();
        let data;

        if (!force && auditCache && auditCache.expiresAt > now) {
            data = { ...auditCache.data, cached: true };
        } else {
            const started = Date.now();
            const result = runAudit();
            data = {
                ...result,
                durationMs: Date.now() - started,
                cached: false,
                mode: 'static-offline',
                source: 'server/scripts/security-audit.js',
                note: 'Static source inspection only. No live/external testing was performed.'
            };
            auditCache = { data, expiresAt: now + AUDIT_TTL_MS };
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Security dashboard audit failed:', error);
        res.status(500).json({ success: false, message: 'Security audit could not run' });
    }
};

/* -------------------------------------------------------- controls ----- */

const getSecurityControls = async (req, res) => {
    try {
        const serverSrc = readSource('server/server.js');
        const authSrc = readSource('server/middleware/auth.middleware.js');
        const configSrc = readSource('server/config/security.js');
        const notificationsSrc = readSource('server/socket/notifications.handler.js');
        const uploadSrc = readSource('server/middleware/upload.middleware.js');

        const has = (src, re) => re.test(src);
        const controls = [
            {
                id: 'helmet', label: 'Helmet security headers',
                enabled: has(serverSrc, /app\.use\(helmet\(\)\)/),
                source: 'server/server.js', detail: 'HTTP security response headers'
            },
            {
                id: 'rate-limit', label: 'Baseline /api rate limiter',
                enabled: has(serverSrc, /app\.use\('\/api',\s*apiLimiter\)/),
                source: 'server/server.js', detail: 'Request ceiling across all API routes'
            },
            {
                id: 'body-limit', label: 'Bounded JSON body size',
                enabled: has(serverSrc, /express\.json\(\{\s*limit:/),
                source: 'server/server.js', detail: 'Payload size cap'
            },
            {
                id: 'cors', label: 'Unknown CORS origins denied',
                enabled: has(serverSrc, /callback\(null,\s*false\)/),
                source: 'server/server.js', detail: 'Allowlist instead of wildcard origin'
            },
            {
                id: 'json-404', label: 'Unknown /api paths return JSON',
                enabled: has(serverSrc, /app\.use\('\/api',\s*\(req,\s*res\)/),
                source: 'server/server.js', detail: 'No HTML error pages for API clients'
            },
            {
                id: 'prod-errors', label: 'Production 5xx responses are generic',
                enabled: has(serverSrc, /isProduction\(\) && statusCode >= 500/),
                source: 'server/server.js', detail: 'No internal error text leaked in production'
            },
            {
                id: 'config-assert', label: 'Production configuration fail-closed',
                enabled: has(serverSrc, /assertProductionConfig\(\)/) && has(configSrc, /function assertProductionConfig/),
                source: 'server/config/security.js', detail: 'Strong JWT secret and owner credentials required'
            },
            {
                id: 'jwt', label: 'Token verification on protected routes',
                enabled: has(authSrc, /security\.verifyToken\(token\)/),
                source: 'server/middleware/auth.middleware.js', detail: 'Signed JWT required by auth middleware'
            },
            {
                id: 'owner-guard', label: 'Owner-only guard middleware',
                enabled: has(authSrc, /exports\.isOwner/),
                source: 'server/middleware/auth.middleware.js', detail: 'Explicit isOwner checks on privileged routes'
            },
            {
                id: 'private-uploads', label: 'Applicant uploads outside the static root',
                enabled: has(uploadSrc, /private/),
                source: 'server/middleware/upload.middleware.js', detail: 'Private directory for sensitive uploads'
            },
            {
                id: 'notification-auth', label: 'Authenticated notification namespace',
                enabled: has(notificationsSrc, /security\.verifyToken\(token\)/) && has(notificationsSrc, /io\.of\('\/notifications'\)/),
                source: 'server/socket/notifications.handler.js', detail: 'JWT-verified per-user rooms'
            }
        ];

        res.json({
            success: true,
            data: {
                controls,
                enabledCount: controls.filter(control => control.enabled).length,
                total: controls.length,
                environment: {
                    production: security.isProduction(),
                    // Secret presence is checked by assertProductionConfig(); the
                    // value is never read here or returned to the dashboard.
                    jwtSecretSource: 'server/config/security.js',
                    ownerCredentialSet: Boolean(process.env.OWNER_PASSWORD || process.env.OWNER_PASSWORD_HASH),
                    mongoUriSet: Boolean(process.env.MONGODB_URI),
                    clientUrlSet: Boolean(process.env.CLIENT_URL)
                },
                // Count only: the issue messages can contain configuration detail.
                configurationIssueCount: security.assertProductionConfig().length,
                generatedAt: new Date().toISOString(),
                mode: 'source-inspection',
                note: 'Detected in local source and environment presence. This is not a live runtime probe; secret values are never returned.'
            }
        });
    } catch (error) {
        console.error('Security controls lookup failed:', error);
        res.status(500).json({ success: false, message: 'Security controls could not be read' });
    }
};

/* -------------------------------------------------------- resources ---- */

const RESOURCE_GROUPS = [
    { id: 'documentation', label: 'Documentation', dir: 'documentation', exts: ['.md'] },
    { id: 'guides', label: 'Guides', dir: 'docs', exts: ['.md'] },
    { id: 'backups', label: 'Backups', dir: 'server/backups', exts: ['.json', '.md'] },
    { id: 'server-scripts', label: 'Server scripts', dir: 'server/scripts', exts: ['.js'] },
    { id: 'build-scripts', label: 'Build scripts', dir: 'scripts', exts: ['.js'] },
    { id: 'tests', label: 'Regression tests', dir: 'tests', exts: ['.mjs', '.js'] },
    { id: 'data-samples', label: 'Data samples', dir: 'src/data', exts: ['.json'] },
    {
        id: 'root-files', label: 'Reports & config templates', dir: '.',
        exts: ['.md', '.example', '.yaml', '.yml', '.toml', ''],
        only: [
            'CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md',
            '.env.example', '.env.render.example', 'render.yaml',
            'backend-deployment.yaml', 'netlify.toml', 'Dockerfile'
        ]
    }
];

const MAX_ITEMS = 400;
const EXCLUDED_PATH = /(^|\/)(node_modules|\.git|dist|build|coverage|private|uploads)(\/|$)/;
const EXCLUDED_EXT = /\.(pem|p12|pfx|key|p8)$/i;

const safeFile = relative => {
    const base = path.basename(relative);
    if (EXCLUDED_PATH.test(relative)) return false;
    if (EXCLUDED_EXT.test(base)) return false;
    // Real .env files must never appear in the inventory; examples are fine.
    if (/^\.env(\.|$)/.test(base) && !base.endsWith('.example')) return false;
    return true;
};

const walk = (dir, out = []) => {
    let entries = [];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (EXCLUDED_PATH.test(path.relative(ROOT, full).split(path.sep).join('/') + '/')) continue;
        if (entry.isDirectory()) walk(full, out);
        else if (entry.isFile()) out.push(full);
    }
    return out;
};

const getResources = async (req, res) => {
    try {
        const items = [];
        for (const group of RESOURCE_GROUPS) {
            const base = path.join(ROOT, group.dir);
            const files = group.only
                ? group.only.map(name => path.join(base, name))
                : walk(base);

            for (const file of files) {
                const relative = path.relative(ROOT, file).split(path.sep).join('/');
                if (!safeFile(relative)) continue;
                if (!group.exts.some(ext => relative.endsWith(ext))) continue;
                let stat;
                try { stat = fs.statSync(file); } catch { continue; }
                if (!stat.isFile()) continue;
                items.push({
                    path: relative,
                    name: path.basename(file),
                    category: group.id,
                    categoryLabel: group.label,
                    sizeBytes: stat.size,
                    modifiedAt: stat.mtime.toISOString(),
                    extension: path.extname(file) || '(none)'
                });
            }
        }

        items.sort((a, b) => a.category.localeCompare(b.category) || a.path.localeCompare(b.path));
        const truncated = items.length > MAX_ITEMS;
        const visible = items.slice(0, MAX_ITEMS);
        const categories = RESOURCE_GROUPS.map(group => {
            const groupItems = items.filter(item => item.category === group.id);
            return {
                id: group.id,
                label: group.label,
                count: groupItems.length,
                bytes: groupItems.reduce((sum, item) => sum + item.sizeBytes, 0)
            };
        });

        res.json({
            success: true,
            data: {
                items: visible,
                categories,
                totalItems: items.length,
                returnedItems: visible.length,
                totalBytes: items.reduce((sum, item) => sum + item.sizeBytes, 0),
                truncated,
                generatedAt: new Date().toISOString(),
                mode: 'local-filesystem',
                note: 'File names and metadata only. Contents, real .env files and private uploads are never returned.'
            }
        });
    } catch (error) {
        console.error('Resource inventory failed:', error);
        res.status(500).json({ success: false, message: 'Resource inventory could not be read' });
    }
};

module.exports = { getSecurityAudit, getSecurityControls, getResources };

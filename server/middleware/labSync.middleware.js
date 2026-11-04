/**
 * Phase 24 — publish a Lab refresh signal after a SUCCESSFUL owner write to
 * the skills or interests routers. Attaching this to the router (instead of
 * editing each controller) means every current and future mutation of these
 * sections notifies public pages without duplicating broadcast code.
 *
 * Only a section name and a timestamp are broadcast; response bodies are never
 * modified, and failed requests never trigger a refresh.
 */
const { emitLabChanged } = require('../utils/labEvents');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const labSync = section => (req, res, next) => {
    if (!WRITE_METHODS.has(req.method)) return next();
    const originalJson = res.json.bind(res);
    res.json = body => {
        if (res.statusCode < 400 && body?.success !== false) {
            try {
                emitLabChanged(section);
            } catch {
                // A socket failure must never turn a successful write into a 500.
            }
        }
        return originalJson(body);
    };
    return next();
};

module.exports = { labSync, WRITE_METHODS };

/**
 * Phase 24 — non-sensitive Lab content-change signal.
 *
 * The public Lab page (including anonymous visitors) listens on the read-only
 * /public-projects namespace; signed-in dashboards also listen on the root
 * namespace. Skills, interests and project mutations publish ONLY a section
 * name and a timestamp. No skill values, interest text, owner details, tokens
 * or database content ever leaves the server in this signal — clients refresh
 * themselves from their own authorised endpoints.
 */
const { PUBLIC_PROJECTS_NAMESPACE } = require('./projectEvents');

const LAB_EVENT = 'lab:changed';
const LAB_SECTIONS = Object.freeze(['skills', 'interests', 'projects']);

const emitLabChanged = (section, ioInstance) => {
    const io = ioInstance || global.io;
    if (!io || typeof io.of !== 'function' || typeof io.emit !== 'function') return;
    if (!LAB_SECTIONS.includes(section)) return;
    const data = Object.freeze({ section, at: new Date().toISOString() });
    io.of(PUBLIC_PROJECTS_NAMESPACE).emit(LAB_EVENT, data);
    io.emit(LAB_EVENT, data);
};

module.exports = { LAB_EVENT, LAB_SECTIONS, emitLabChanged };

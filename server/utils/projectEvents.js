/**
 * Canonical project-count broadcast.
 *
 * The public Projects page (including anonymous visitors) subscribes to the
 * unauthenticated /public-projects namespace. Dashboard/owner listeners on the
 * root namespace keep receiving `project_changed` for their existing flows.
 * One helper means a like, view, create, update or delete can never update the
 * database without also telling every public page to refresh its counts.
 */
const PUBLIC_PROJECTS_NAMESPACE = '/public-projects';
const PROJECT_STATS_EVENT = 'project:stats';

/**
 * @param {{projectId?: string, title?: string, likes?: number, views?: number,
 *          action?: string, project?: object}} payload
 * @param {object} [ioInstance] explicit Socket.IO instance (falls back to global.io)
 */
const emitProjectStats = (payload = {}, ioInstance) => {
    const io = ioInstance || global.io;
    if (!io || typeof io.of !== 'function' || typeof io.emit !== 'function') return;

    const projectId = payload.projectId
        ? String(payload.projectId)
        : (payload.project?._id ? String(payload.project._id) : undefined);
    const title = payload.title || payload.project?.title;
    const likes = payload.likes ?? payload.project?.likes;
    const views = payload.views ?? payload.project?.views;
    const data = {
        projectId,
        title,
        action: payload.action || 'stats',
        at: new Date().toISOString()
    };
    // Only send counters we actually know. A delete broadcast must not reset
    // a matched project's likes/views to zero.
    if (Number.isFinite(Number(likes)) && likes !== undefined && likes !== null) data.likes = Number(likes);
    if (Number.isFinite(Number(views)) && views !== undefined && views !== null) data.views = Number(views);
    Object.freeze(data);

    io.of(PUBLIC_PROJECTS_NAMESPACE).emit(PROJECT_STATS_EVENT, data);
    io.emit('project_changed', { action: data.action, ...data });
};

module.exports = { PUBLIC_PROJECTS_NAMESPACE, PROJECT_STATS_EVENT, emitProjectStats };

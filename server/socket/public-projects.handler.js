/**
 * Read-only Socket.IO namespace for public portfolio project counts.
 * No authentication, no user data and no client-to-server commands: the server
 * only broadcasts like/view changes so anonymous public pages stay in sync.
 */
const { PUBLIC_PROJECTS_NAMESPACE } = require('../utils/projectEvents');

module.exports = io => {
    const namespace = io.of(PUBLIC_PROJECTS_NAMESPACE);
    namespace.on('connection', socket => {
        // Deliberately stateless: visitors only listen, they cannot publish.
        socket.emit('public:projects:ready', { namespace: PUBLIC_PROJECTS_NAMESPACE });
    });
};

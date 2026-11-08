/**
 * Phase 30 — canonical auth-role vocabulary.
 *
 * The repo had one shared /auth/login form for every credential path while
 * the dashboard only knew three roles: owner (bootstrap OWNER_EMAIL /
 * OWNER_PASSWORD), collaborator (/auth/login/collaborator) and user (regular
 * DB account). A seeded DB account uses the legacy role `admin`, which no
 * dashboard menu item listed, so signing in with it produced an empty sidebar
 * and no main links. Phase 31 split the owner flow into /auth/login/owner and
 * kept /auth/login for regular users; this module stays the shared vocabulary.
 *
 * This module is deliberately presentation/routing only. It does NOT grant
 * privileges: the server's `isOwner` middleware still requires the literal
 * `owner` role, and `isOwnerRole()` below stays strict. An admin is mapped to
 * the regular-user menu set, never to owner-only panels whose APIs would 403.
 */

export const OWNER_ROLE = 'owner';
export const ADMIN_ROLE = 'admin';
export const COLLABORATOR_ROLE = 'collaborator';
export const USER_ROLE = 'user';
export const VISITOR_ROLE = 'visitor';

const ROLE_ALIASES = {
    owner: OWNER_ROLE,
    admin: ADMIN_ROLE,
    administrator: ADMIN_ROLE,
    superadmin: ADMIN_ROLE,
    root: ADMIN_ROLE,
    collaborator: COLLABORATOR_ROLE,
    user: USER_ROLE,
    member: USER_ROLE,
    visitor: VISITOR_ROLE
};

/** Lower-case, trim and fold legacy role names into the canonical set. */
export const normalizeRole = (role) => {
    if (typeof role !== 'string') return VISITOR_ROLE;
    const key = role.trim().toLowerCase();
    if (!key) return VISITOR_ROLE;
    return ROLE_ALIASES[key] || key;
};

/** Strict: only the bootstrap owner has owner privileges. */
export const isOwnerRole = (role) => normalizeRole(role) === OWNER_ROLE;

/** Legacy seeded admin account — NOT owner-equivalent. */
export const isAdminRole = (role) => normalizeRole(role) === ADMIN_ROLE;

/** Every role that is allowed to open the dashboard after a successful login. */
export const DASHBOARD_ROLES = [OWNER_ROLE, ADMIN_ROLE, COLLABORATOR_ROLE, USER_ROLE];
export const canOpenDashboard = (role) => DASHBOARD_ROLES.includes(normalizeRole(role));

/**
 * Which `item.roles` values a given session may see. Existing roles keep their
 * exact previous visibility; the legacy admin gets the regular-user set so the
 * main links appear without exposing owner-only tools.
 */
export const rolesForMenu = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === OWNER_ROLE) return [OWNER_ROLE];
    if (normalized === ADMIN_ROLE) return [ADMIN_ROLE, USER_ROLE];
    if (normalized === COLLABORATOR_ROLE) return [COLLABORATOR_ROLE];
    if (normalized === USER_ROLE) return [USER_ROLE];
    return [];
};

export const canSeeMenuItem = (item, role) =>
    Array.isArray(item?.roles) && item.roles.some(r => rolesForMenu(role).includes(r));

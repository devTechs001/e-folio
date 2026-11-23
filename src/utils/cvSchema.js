/**
 * Shared CV section contract.
 *
 * The model, the save endpoint, the editor, the public CV page and the HTML
 * export all read the same section list, so a section can never be saved by
 * one side and silently dropped by another. Order here is display order.
 */
export const CV_SECTION_KEYS = Object.freeze([
    'personalInfo',
    'experience',
    'education',
    'skills',
    'projects',
    'achievements',
    'certifications',
    'languages',
    'links',
    'settings'
]);

/** Array-of-entries sections (each entry has an id + visible flag). */
export const CV_ENTRY_SECTIONS = Object.freeze([
    'experience',
    'education',
    'projects',
    'achievements',
    'certifications',
    'languages',
    'links'
]);

/** Entry field names, used by the editor form. */
export const CV_ENTRY_FIELDS = Object.freeze({
    experience: ['title', 'company', 'period', 'location', 'description'],
    education: ['degree', 'institution', 'period', 'details'],
    projects: ['name', 'description', 'url'],
    achievements: ['text'],
    certifications: ['name', 'issuer', 'period', 'credentialUrl'],
    languages: ['name', 'level'],
    links: ['label', 'url']
});

export const CV_LANGUAGE_LEVELS = Object.freeze([
    'Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'
]);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /^(https?:\/\/|\/)[^\s]+$/i;

export const isCvEmail = value => EMAIL_RE.test(String(value || '').trim());
export const isCvUrl = value => URL_RE.test(String(value || '').trim());

/**
 * Read-only review of a CV document. Never mutates and never blocks a save:
 * it only tells the user what still needs attention, using facts from their
 * own document (no sample values, no invented scores).
 */
export const reviewCv = (cv = {}) => {
    const safe = cv && typeof cv === 'object' ? cv : {};
    const personal = safe.personalInfo || {};
    const list = key => (Array.isArray(safe[key]) ? safe[key].filter(item => item && item.visible !== false) : []);
    const skillGroups = safe.skills && typeof safe.skills === 'object' && !Array.isArray(safe.skills)
        ? Object.entries(safe.skills).filter(([, items]) => Array.isArray(items) && items.length > 0)
        : [];
    const links = list('links');

    const checks = [];
    const add = (id, label, ok, detail, level = 'warn') =>
        checks.push({ id, label, ok: Boolean(ok), detail, level });

    add('name', 'Name is filled in', String(personal.name || '').trim(), 'Add your full name in Personal info', 'error');
    add('title', 'Professional title', String(personal.title || '').trim(), 'A short title helps readers place you');
    add('contact', 'A way to reach you', personal.email || personal.phone, 'Add an email or phone number', 'error');
    add('email', 'Email format', !personal.email || isCvEmail(personal.email), 'That email address does not look valid', 'error');
    add('summary', 'Short summary', String(personal.bio || '').trim().length >= 40, 'Two sentences about your focus');
    add('experience', 'At least one role', list('experience').length > 0, 'Experience is usually read first');
    add('education', 'At least one qualification', list('education').length > 0, 'Add your education entries');
    add('skills', 'Skills grouped', skillGroups.length > 0, 'Add at least one skills group');
    add('projects', 'Projects listed', list('projects').length > 0, 'Projects show what you have built');
    add('links', 'Links are valid', links.every(link => !link.url || isCvUrl(link.url)), 'Links start with http(s):// or /');
    add('certifications', 'Certifications', true, `${list('certifications').length} listed`);
    add('languages', 'Languages', true, `${list('languages').length} listed`);

    const pending = checks.filter(check => !check.ok);
    const blockers = pending.filter(check => check.level === 'error');
    return {
        checks,
        pending,
        blockers,
        ready: blockers.length === 0,
        score: Math.round(((checks.length - pending.length) / checks.length) * 100)
    };
};

/** Counts every visible entry per section (facts from the document only). */
export const summarizeCv = (cv = {}) => {
    const safe = cv && typeof cv === 'object' ? cv : {};
    const count = key => (Array.isArray(safe[key]) ? safe[key].filter(item => item && item.visible !== false).length : 0);
    const skillCount = safe.skills && typeof safe.skills === 'object' && !Array.isArray(safe.skills)
        ? Object.values(safe.skills).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0)
        : 0;
    return {
        ...reviewCv(safe),
        counts: {
            experience: count('experience'),
            education: count('education'),
            projects: count('projects'),
            achievements: count('achievements'),
            certifications: count('certifications'),
            languages: count('languages'),
            links: count('links'),
            skills: skillCount
        }
    };
};

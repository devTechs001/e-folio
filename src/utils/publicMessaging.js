/**
 * Public-facing copy and developer-only diagnostics.
 *
 * Rule: public visitors never see status codes, "server is offline", "database
 * data unavailable", raw exception text, or "temporarily unavailable" banners.
 * They see real content (loaded from the bundled snapshot) and, when needed,
 * short friendly sentences. All technical detail is kept for developers: it is
 * recorded in an in-memory buffer, printed only in dev builds, and surfaced by
 * the dev-only <DevDiagnostics /> panel — never in the public UI.
 */

export const IS_DEV = Boolean(import.meta.env.DEV);

/** Short, non-technical sentences that are safe to show to visitors. */
export const PUBLIC_COPY = Object.freeze({
    archive: 'A selection from the portfolio archive',
    projects: 'Explore a selection of recent work below.',
    skills: 'A snapshot of the toolkit behind the work.',
    interests: 'A few things I enjoy working on.',
    education: 'Education and training highlights.',
    testimonials: 'A selection of client feedback.',
    lab: 'Experiments and tools from the lab.',
    emptyProjects: 'Try adjusting your filters or explore another category.',
    emptySkills: 'Skill details will appear here.',
    emptyInterests: 'More interests will appear here.',
    emptyTestimonials: 'More feedback will appear here.',
    emptyLab: 'More experiments will appear here.',
    contact: 'Thanks for getting in touch — I will reply as soon as I can.',
    auth: 'We could not sign you in right now. Please try again shortly.',
    registration: 'We could not complete registration right now. Please try again shortly.',
    invite: 'We could not verify this invitation right now. Please try again shortly.',
    collaboration: 'We could not send your request right now. Please try again shortly.'
});

/** Friendly empty-state copy; never an error or status string. */
export const publicEmptyCopy = section => PUBLIC_COPY[section] || PUBLIC_COPY.archive;

/** Friendly copy for any public-facing situation; never a raw error string. */
export const publicCopy = key => PUBLIC_COPY[key] || PUBLIC_COPY.archive;

const MAX_ISSUES = 25;
const issues = [];

const statusFromError = error => {
    const message = String(error?.message || '');
    const match = message.match(/(?:status|page \()\s*(\d{3})/i) || message.match(/\b([45]\d{2})\b/);
    return match ? Number(match[1]) : null;
};

/**
 * Record technical detail for developers only. In production builds nothing is
 * logged to the console; the entry is still available to dev tooling so it can
 * be inspected from the console when needed.
 */
export const recordDevIssue = ({ section, endpoint, error, detail }) => {
    const issue = Object.freeze({
        at: new Date().toISOString(),
        section: section || 'unknown',
        endpoint: endpoint || '',
        name: error?.name || 'Error',
        message: String(error?.message || detail || 'Unknown technical issue'),
        detail: detail ? String(detail) : '',
        status: statusFromError(error)
    });
    issues.push(issue);
    if (issues.length > MAX_ISSUES) issues.shift();
    if (IS_DEV) {
        // Technical detail is deliberately kept here, for developers only.
        console.warn(`[dev:${issue.section}] ${issue.endpoint}`, issue.message, issue.status || '');
    }
    return issue;
};

/** Read-only copy of the technical buffer (developer tooling / dev panel). */
export const getDevIssues = () => issues.slice();

export const clearDevIssues = () => { issues.length = 0; };

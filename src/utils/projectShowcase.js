/**
 * Canonical, verified external project links for the public Projects section.
 *
 * The URL lives in ONE shared JSON file (src/data/projectShowcase.json) that
 * the UI cards and the MongoDB seeder both read. Existing project records and
 * existing project links — including the NetGate link — are never modified by
 * this module; it only describes ADDITIONAL entries.
 */
import dataset from '../data/projectShowcase.json';

export const SHOWCASE_TAG = dataset.tag;
export const SHOWCASE_SOURCE = dataset.source;

/** Only absolute HTTPS links without embedded credentials may be rendered. */
export const isSafeShowcaseUrl = url => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch {
        return false;
    }
};

export const PROJECT_SHOWCASE = Object.freeze(
    dataset.projects
        .filter(project => isSafeShowcaseUrl(project.url))
        .map(project => Object.freeze({
            ...project,
            features: Object.freeze([...(project.features || [])]),
            securityNotes: Object.freeze([...(project.securityNotes || [])]),
            technologies: Object.freeze([...(project.technologies || [])]),
            tags: Object.freeze([...(project.tags || [])])
        }))
);

/** Safe, consistent anchor attributes for an external project link. */
export const showcaseAnchorProps = project => Object.freeze({
    href: project.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    referrerPolicy: 'no-referrer'
});

/** Absolute URL for copying/sharing, independent of the current page. */
export const showcaseShareUrl = project => project.url;

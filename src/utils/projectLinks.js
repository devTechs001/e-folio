/**
 * Owner-supplied project links for the public Projects page.
 *
 * Titles/URLs live in ONE shared JSON file. The catalogue is intentionally
 * minimal: a title and a link only. It carries no invented stacks, metrics,
 * likes, views, achievements or live-status claims, so the page never has to
 * render a zero value for information that does not exist.
 */
import dataset from '../data/projectLinks.json';

export const PROJECT_LINKS_TAG = dataset.tag;
export const PROJECT_LINKS_SOURCE = dataset.source;

/** Only absolute HTTPS links without embedded credentials may be rendered. */
export const isSafeProjectLink = url => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch {
        return false;
    }
};

/** A readable host label derived from the URL itself (no invented copy). */
export const projectLinkHost = url => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
};

export const PROJECT_LINKS = Object.freeze(
    dataset.projects
        .filter(project => isSafeProjectLink(project.url))
        .map(project => Object.freeze({ ...project }))
);

/** Safe, consistent anchor attributes for an external project link. */
export const projectLinkAnchorProps = project => Object.freeze({
    href: project.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    referrerPolicy: 'no-referrer'
});

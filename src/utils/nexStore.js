/**
 * Canonical NEX Store link shown on the public projects pages.
 *
 * The URL is intentionally a single shared constant so the header button and
 * the call-to-action card can never drift apart, and so the project links
 * themselves (including the NetGate links) stay untouched. This module only
 * describes how the EXISTING link is presented; it does not replace it.
 */
export const NEX_STORE_URL = 'https://nex-store-pro.netlify.app/';

export const NEX_STORE = Object.freeze({
    name: 'NEX Store',
    url: NEX_STORE_URL,
    tagline: 'All systems and apps in one place',
    description:
        'A featured external showcase: browse the systems, apps and tools published in the NEX Store.',
    category: 'Featured · External site',
    // Real capabilities of the link itself, not invented store inventory.
    features: ['Systems & apps', 'One-place catalogue', 'Opens in a new tab']
});

/** Safe, consistent anchor attributes for the external store link. */
export const nexStoreAnchorProps = Object.freeze({
    href: NEX_STORE_URL,
    target: '_blank',
    rel: 'noopener noreferrer',
    referrerPolicy: 'no-referrer'
});

/** Absolute URL for sharing/copying, without depending on the current page. */
export const nexStoreShareUrl = () => NEX_STORE_URL;

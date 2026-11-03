/**
 * Real-API helpers for CV / portfolio creation and public links.
 *
 * Every registered user (role `user`) gets their own CV and portfolio records.
 * `GET /api/cv` and `GET /api/portfolio/config` are the server's idempotent
 * "get or create" endpoints, so calling them is the supported way to create a
 * workspace for a new account. Nothing is fabricated locally.
 */
import apiService from '../services/api.service';

export const publicUserLinks = username => {
    const slug = encodeURIComponent(String(username || '').trim());
    return {
        cv: slug ? `/cv/${slug}` : '',
        portfolio: slug ? `/portfolio/${slug}` : '',
        cvApi: slug ? `/public/cv/${slug}` : '',
        portfolioApi: slug ? `/public/portfolio/${slug}` : ''
    };
};

/** Same-origin registration link for sharing (never a hardcoded host). */
export const registrationLink = () => {
    if (typeof window === 'undefined') return '/register';
    return `${window.location.origin}/register`;
};

/** Create/fetch the current user's CV and portfolio through the real APIs. */
export async function ensureUserWorkspace() {
    const [cvResult, portfolioResult] = await Promise.allSettled([
        apiService.getCV(),
        apiService.getPortfolioConfig()
    ]);
    const read = result => (result.status === 'fulfilled' ? result.value : null);
    const cv = read(cvResult);
    const portfolio = read(portfolioResult);
    const errors = [];
    if (!cv?.success) errors.push(cv?.message || 'CV API unavailable');
    if (!portfolio?.success) errors.push(portfolio?.message || 'Portfolio API unavailable');
    return {
        cvReady: Boolean(cv?.success),
        portfolioReady: Boolean(portfolio?.success),
        cv,
        portfolio,
        errors
    };
}

/**
 * Completeness checklist derived ONLY from the real CV/portfolio documents.
 * No sample values and no invented counts: an item is ready when the server
 * actually returned content for it.
 */
export function buildWorkspaceChecklist(cvResponse, portfolioResponse) {
    const cv = cvResponse?.success ? (cvResponse.data || {}) : null;
    const portfolio = portfolioResponse?.success ? (portfolioResponse.data || {}) : null;
    const personal = cv?.personalInfo || {};
    const hasEntries = value => Array.isArray(value) ? value.length > 0
        : (value && typeof value === 'object' ? Object.values(value).some(entry => Array.isArray(entry) && entry.length > 0) : false);
    const sections = Array.isArray(portfolio?.sections) ? portfolio.sections : [];

    const items = [
        { id: 'cv-record', label: 'CV record', ready: Boolean(cv), detail: cv ? 'Server returned a CV document' : 'Create / refresh to provision' },
        { id: 'cv-name', label: 'Name & title', ready: Boolean(personal.name && personal.title), detail: personal.name || 'Add these in the CV Editor' },
        { id: 'cv-contact', label: 'Contact details', ready: Boolean(personal.email || personal.phone), detail: personal.email || 'Add an email or phone' },
        { id: 'cv-experience', label: 'Experience', ready: hasEntries(cv?.experience), detail: hasEntries(cv?.experience) ? 'Saved entries present' : 'Add experience entries' },
        { id: 'cv-education', label: 'Education', ready: hasEntries(cv?.education), detail: hasEntries(cv?.education) ? 'Saved entries present' : 'Add education entries' },
        { id: 'cv-skills', label: 'Skills', ready: hasEntries(cv?.skills), detail: hasEntries(cv?.skills) ? 'Saved skills present' : 'Add skills' },
        { id: 'portfolio-record', label: 'Portfolio record', ready: Boolean(portfolio), detail: portfolio ? 'Server returned a configuration' : 'Create / refresh to provision' },
        { id: 'portfolio-sections', label: 'Portfolio sections', ready: sections.some(s => s.visible !== false), detail: `${sections.length} section(s) from the API` },
        { id: 'portfolio-theme', label: 'Portfolio theme', ready: Boolean(portfolio?.theme?.primaryColor), detail: portfolio?.theme?.primaryColor || 'Choose a theme in the editor' },
        { id: 'portfolio-seo', label: 'Portfolio SEO', ready: Boolean(portfolio?.seo?.title), detail: portfolio?.seo?.title || 'Add an SEO title' }
    ];
    const ready = items.filter(item => item.ready).length;
    return { items, ready, total: items.length, percent: Math.round((ready / items.length) * 100) };
}

export async function publishUserPortfolio() {
    try {
        return await apiService.publishPortfolio();
    } catch (error) {
        return { success: false, message: error?.message || 'Portfolio publish failed' };
    }
}

export async function unpublishUserPortfolio() {
    try {
        return await apiService.unpublishPortfolio();
    } catch (error) {
        return { success: false, message: error?.message || 'Portfolio unpublish failed' };
    }
}

/**
 * Create an account for another person using the real registration endpoint.
 * Deliberately does NOT store the returned token: the signed-in owner/user
 * keeps their own session, and the new holder signs in separately.
 */
export async function createAccountForAnotherUser({ name, username, email, password }) {
    const response = await apiService.register({ name, username, email, password });
    return {
        success: Boolean(response?.success),
        message: response?.message || 'Registration failed',
        user: response?.user || null
    };
}

/** Read-only workspace status for another account through public endpoints. */
export async function inspectUserWorkspace(username) {
    const slug = String(username || '').trim();
    if (!slug) return { cvReady: false, portfolioReady: false, message: 'Username is required' };
    const [cvResult, portfolioResult] = await Promise.allSettled([
        apiService.getPublicCV(slug),
        apiService.getPublicPortfolio(slug)
    ]);
    const cvResponse = cvResult.status === 'fulfilled' ? cvResult.value : null;
    const portfolioResponse = portfolioResult.status === 'fulfilled' ? portfolioResult.value : null;
    return {
        cvReady: Boolean(cvResponse?.success),
        portfolioReady: Boolean(portfolioResponse?.success),
        user: cvResponse?.user || portfolioResponse?.user || null,
        cvMessage: cvResponse?.message || (cvResult.status === 'rejected' ? 'CV API unavailable' : ''),
        portfolioMessage: portfolioResponse?.message || (portfolioResult.status === 'rejected' ? 'Portfolio API unavailable' : ''),
        links: publicUserLinks(slug)
    };
}

/** Owner-only real-time notification to another account holder. */
export async function notifyWorkspaceUser(userId, payload) {
    return apiService.notifyUser(userId, payload);
}

/** Download the real CV JSON export returned by `/api/cv/export/json`. */
export async function downloadCVExport(username = 'cv') {
    const response = await apiService.exportCV('json');
    const document = response?.data || response;
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
        return { success: false, message: 'CV export returned no data' };
    }
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${username || 'cv'}_export.json`;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true };
}

export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(String(text));
        return { success: true };
    } catch (error) {
        return { success: false, message: error?.message || 'Clipboard access denied' };
    }
}

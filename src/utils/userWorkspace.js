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

export async function publishUserPortfolio() {
    try {
        return await apiService.publishPortfolio();
    } catch (error) {
        return { success: false, message: error?.message || 'Portfolio publish failed' };
    }
}

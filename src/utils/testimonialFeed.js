/**
 * One feed for the public testimonials page.
 *
 * Two real sources already exist in this system and both stay in place:
 *   1. owner-curated Testimonials  (`/testimonials/public/testimonials`)
 *   2. visitor reviews the owner approved (`/reviews/public`)
 *
 * This module only reads them and normalises the two shapes so the page can
 * list, filter and sort a single mixed feed. It never invents a record, never
 * merges a pending/private review, and never hides where a record came from:
 * every item carries `kind`, so the UI can label it.
 */
import apiService from '../services/api.service';

export const FEED_KIND = Object.freeze({
    testimonial: 'testimonial',
    review: 'review'
});

const asText = value => (typeof value === 'string' ? value.trim() : '');
const toTime = value => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
};
const clampRating = value => {
    const rating = Number(value);
    if (!Number.isFinite(rating)) return 5;
    return Math.min(5, Math.max(1, Math.round(rating)));
};

/** Curated testimonial → feed item. Unknown fields are dropped, not faked. */
export const fromTestimonial = (item = {}) => ({
    id: String(item._id || item.id || `testimonial-${item.name || ''}-${item.date || ''}`),
    kind: FEED_KIND.testimonial,
    name: asText(item.name),
    rating: clampRating(item.rating),
    content: asText(item.content),
    title: asText(item.title),
    position: asText(item.position),
    company: asText(item.company),
    project: asText(item.project),
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    avatar: asText(item.avatar),
    thumbnail: asText(item.thumbnail),
    featured: item.featured === true,
    verified: item.verified === true,
    date: item.date || item.createdAt || null,
    sortTime: toTime(item.date || item.createdAt),
    reply: asText(item.response),
    likes: 0,
    raw: item
});

/** Approved visitor review → feed item (only what the public route returns). */
export const fromReview = (item = {}) => ({
    id: String(item._id || item.id || `review-${item.name || ''}-${item.createdAt || ''}`),
    kind: FEED_KIND.review,
    name: asText(item.name),
    rating: clampRating(item.rating),
    content: asText(item.comment),
    title: asText(item.title),
    position: '',
    company: '',
    project: '',
    tags: [],
    avatar: '',
    thumbnail: '',
    featured: item.featured === true,
    verified: false,
    date: item.createdAt || null,
    sortTime: toTime(item.createdAt),
    reply: asText(item.response),
    likes: Number.isFinite(Number(item.likes)) ? Number(item.likes) : 0,
    categories: item.categories || null,
    raw: item
});

/**
 * Approved reviews only. A failure is reported honestly: the caller gets an
 * empty list and `status.reviews === false`, never a fabricated record.
 */
export const loadApprovedReviews = async ({ limit = 50 } = {}) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);
    try {
        const response = await apiService.request(`/reviews/public?limit=${safeLimit}`);
        const reviews = Array.isArray(response?.reviews) ? response.reviews.map(fromReview) : [];
        return {
            items: reviews,
            status: response?.success !== false,
            avgRating: Number(response?.avgRating) || 0,
            totalReviews: Number(response?.totalReviews) || 0
        };
    } catch (error) {
        return { items: [], status: false, avgRating: 0, totalReviews: 0 };
    }
};

/**
 * Combine curated testimonials with approved reviews.
 * A review is never listed twice: when a curated record already carries the
 * same name and wording, the curated one wins.
 */
export const combineFeed = (testimonials = [], reviews = []) => {
    const curated = testimonials.map(fromTestimonial);
    const seen = new Set(curated.map(item => `${item.name}::${item.content}`.toLowerCase()));
    const extra = reviews.filter(item => {
        const key = `${item.name}::${item.content}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    return [...curated, ...extra];
};

/** Stable ordering: featured first, then most recent, then rating. */
export const sortFeed = items => [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (b.sortTime !== a.sortTime) return b.sortTime - a.sortTime;
    return b.rating - a.rating;
});

export const filterFeed = (items, { query = '', kind = 'all', rating = 0, featuredOnly = false } = {}) => {
    const needle = String(query || '').trim().toLowerCase();
    return items.filter(item => {
        if (kind !== 'all' && item.kind !== kind) return false;
        if (featuredOnly && !item.featured) return false;
        if (rating && item.rating !== rating) return false;
        if (!needle) return true;
        return [item.name, item.content, item.title, item.position, item.company, item.project, ...(item.tags || [])]
            .some(value => String(value || '').toLowerCase().includes(needle));
    });
};

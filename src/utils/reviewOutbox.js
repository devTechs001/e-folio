/**
 * Honest offline outbox for public review submissions (phase 20).
 *
 * When the backend is unreachable, a visitor's REAL review is saved on their
 * own device with an explicit "not yet submitted" message and retried
 * automatically. A queued review is never published, never counted as
 * submitted and never shown as public social proof. Only ids/status signals
 * are shared across tabs — no review text, names or email addresses.
 */
import apiService from '../services/api.service';

export const REVIEW_OUTBOX_KEY = 'e-folio:pending-reviews';
const SIGNAL_KEY = 'e-folio:reviews-changed';
const CHANNEL_NAME = 'e-folio-reviews';
const WINDOW_EVENT = 'reviewsChanged';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readQueue = () => {
    if (!isBrowser()) return [];
    try {
        const parsed = JSON.parse(localStorage.getItem(REVIEW_OUTBOX_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};

const writeQueue = items => {
    if (!isBrowser()) return;
    try { localStorage.setItem(REVIEW_OUTBOX_KEY, JSON.stringify(items)); } catch { /* storage may be full */ }
};

export const getQueuedReviews = () => readQueue();

const isOfflineFailure = error => {
    const message = String(error?.message || '').toLowerCase();
    return /timed out|unable to connect|failed to fetch|network|html error page|temporarily unavailable|service is temporarily unavailable|status 50[23]/.test(message);
};

export const publishReviewsChanged = () => {
    if (!isBrowser()) return;
    try { localStorage.setItem(SIGNAL_KEY, String(Date.now())); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent(WINDOW_EVENT)); } catch { /* ignore */ }
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage('changed');
            channel.close();
        }
    } catch { /* ignore */ }
};

export const subscribeReviewsChanged = handler => {
    if (!isBrowser() || typeof handler !== 'function') return () => {};
    const onStorage = event => {
        if (event.key === SIGNAL_KEY || event.key === REVIEW_OUTBOX_KEY) handler();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(WINDOW_EVENT, handler);
    let channel;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = () => handler();
        }
    } catch { /* ignore */ }
    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(WINDOW_EVENT, handler);
        try { channel?.close(); } catch { /* ignore */ }
    };
};

/** Submit now; if the service is unreachable, queue honestly instead of lying. */
export const submitReview = async payload => {
    try {
        const response = await apiService.createReview(payload);
        if (response?.success === false) {
            return { success: false, message: response.message || 'Your review could not be submitted.' };
        }
        publishReviewsChanged();
        void flushReviewOutbox();
        return {
            success: true,
            submitted: true,
            message: response?.message || 'Review submitted successfully! It will be published after moderation.'
        };
    } catch (error) {
        if (!isOfflineFailure(error) || !isBrowser()) {
            // Only surfaced messages already written as visitor-friendly
            // validation copy. Raw HTTP/DB wording stays internal.
            const message = String(error?.message || '');
            const friendly = /already submitted recently|at least 10 characters|between 1 and 5|invalid email format|name, rating, and comment/i.test(message)
                ? message
                : 'Your review could not be submitted. Please try again.';
            return { success: false, message: friendly };
        }
        const queue = readQueue();
        queue.push({ id: `local-${Date.now()}-${queue.length}`, payload, queuedAt: new Date().toISOString() });
        writeQueue(queue);
        publishReviewsChanged();
        return {
            success: true,
            queued: true,
            message: 'Saved on this device — not yet submitted. It will be sent automatically when the service is available.'
        };
    }
};

/** Retry queued reviews in order. Stop at the first network failure. */
let flushInFlight = null;

const runFlush = async () => {
    const queue = readQueue();
    if (queue.length === 0) return { sent: 0, remaining: 0 };
    const remaining = [];
    let sent = 0;

    for (const item of queue) {
        try {
            const response = await apiService.createReview(item?.payload || {});
            if (response?.success === false) {
                // A validation/duplicate rejection is final; do not retry forever.
                continue;
            }
            sent += 1;
        } catch (error) {
            if (isOfflineFailure(error)) {
                remaining.push(item, ...queue.slice(queue.indexOf(item) + 1));
                break;
            }
            // Other errors are final too, so the outbox cannot grow without bound.
        }
    }

    writeQueue(remaining);
    if (sent > 0) publishReviewsChanged();
    return { sent, remaining: remaining.length };
};

/** Serialised so two open public pages cannot send the same queue twice. */
export const flushReviewOutbox = () => {
    if (flushInFlight) return flushInFlight;
    flushInFlight = runFlush().finally(() => { flushInFlight = null; });
    return flushInFlight;
};

/**
 * Local draft storage for the CV editor.
 *
 * The server is still the source of truth: a draft is only ever written after
 * a deliberate "save draft" action, and it is always labelled with a
 * timestamp so the UI can say exactly what is stored where. Nothing here is
 * invented content — it is a copy of the user's own working document.
 *
 * Scoped per account so two users sharing a browser never see each other's
 * draft, and it is cleared as soon as the server save succeeds.
 */
const KEY_PREFIX = 'e-folio:cv-draft:';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // a week

const keyFor = userId => `${KEY_PREFIX}${userId || 'anonymous'}`;

const isStorageAvailable = () => {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch (error) {
        return false;
    }
};

export const saveCvDraft = (userId, cv) => {
    if (!isStorageAvailable() || !cv) return null;
    const record = { savedAt: new Date().toISOString(), cv };
    try {
        window.localStorage.setItem(keyFor(userId), JSON.stringify(record));
        return record;
    } catch (error) {
        // Quota or private mode: the editor keeps working from memory.
        return null;
    }
};

export const readCvDraft = userId => {
    if (!isStorageAvailable()) return null;
    try {
        const raw = window.localStorage.getItem(keyFor(userId));
        if (!raw) return null;
        const record = JSON.parse(raw);
        if (!record || !record.cv || !record.savedAt) return null;
        if (Date.now() - new Date(record.savedAt).getTime() > MAX_AGE_MS) {
            window.localStorage.removeItem(keyFor(userId));
            return null;
        }
        return record;
    } catch (error) {
        return null;
    }
};

export const clearCvDraft = userId => {
    if (!isStorageAvailable()) return;
    try {
        window.localStorage.removeItem(keyFor(userId));
    } catch (error) {
        // Nothing to do: a stale draft expires on its own.
    }
};

/** Human wording for a stored draft, used next to the restore button. */
export const describeCvDraft = record => {
    if (!record?.savedAt) return '';
    const when = new Date(record.savedAt);
    if (Number.isNaN(when.getTime())) return '';
    return when.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

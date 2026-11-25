/**
 * Cross-tab project-change notification for the public portfolio.
 *
 * The dashboard and the public page can be open in different tabs/windows.
 * A save in the dashboard publishes here; every open public Projects page
 * refreshes its counts immediately instead of waiting for the polling timer.
 * Only a timestamp is shared — no project data, tokens or user details.
 */
export const PROJECTS_SYNC_KEY = 'e-folio:projects-changed';
const CHANNEL_NAME = 'e-folio-projects';
const WINDOW_EVENT = 'projectsChanged';

export const publishProjectsChanged = () => {
    try {
        localStorage.setItem(PROJECTS_SYNC_KEY, String(Date.now()));
    } catch { /* storage may be blocked; the other signals still work */ }
    try {
        window.dispatchEvent(new CustomEvent(WINDOW_EVENT));
    } catch { /* ignore */ }
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage('changed');
            channel.close();
        }
    } catch { /* ignore */ }
};

export const subscribeProjectsChanged = handler => {
    if (typeof handler !== 'function') return () => {};
    const onStorage = event => {
        if (event.key === PROJECTS_SYNC_KEY) handler();
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

/**
 * Phase 42 — the Lab's own cross-tab signal.
 *
 * The Lab is a separate module with a separate collection, so it must not reuse
 * the projects channel: a lab edit would otherwise tell every open Projects page
 * to refresh, and vice versa, keeping the two modules coupled at the event layer
 * even though the data is now separate.
 */
export const LAB_SYNC_KEY = 'e-folio:lab-changed';
const LAB_CHANNEL_NAME = 'e-folio-lab';
const LAB_WINDOW_EVENT = 'labChanged';

export const publishLabChanged = () => {
    try {
        localStorage.setItem(LAB_SYNC_KEY, String(Date.now()));
    } catch { /* storage may be blocked; the other signals still work */ }
    try {
        window.dispatchEvent(new CustomEvent(LAB_WINDOW_EVENT));
    } catch { /* ignore */ }
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(LAB_CHANNEL_NAME);
            channel.postMessage('changed');
            channel.close();
        }
    } catch { /* ignore */ }
};

export const subscribeLabChanged = handler => {
    if (typeof handler !== 'function') return () => {};
    const onStorage = event => {
        if (event.key === LAB_SYNC_KEY) handler();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LAB_WINDOW_EVENT, handler);

    let channel;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel(LAB_CHANNEL_NAME);
            channel.onmessage = () => handler();
        }
    } catch { /* ignore */ }

    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(LAB_WINDOW_EVENT, handler);
        try { channel?.close(); } catch { /* ignore */ }
    };
};

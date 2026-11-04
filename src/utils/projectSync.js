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

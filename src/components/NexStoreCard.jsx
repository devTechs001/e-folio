// Enhanced NEX Store link for the public projects pages.
//
// The destination URL is unchanged. What is enhanced: safe external-link
// attributes, a real copy-link / share action, a client-generated QR code, an
// offline hint, a locally recorded open count, keyboard/ARIA support and a
// responsive presentation shared by every placement of the link.
import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Copy, Share2, QrCode, Store, WifiOff, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useNotifications } from './NotificationSystem';
import { NEX_STORE, NEX_STORE_URL, nexStoreAnchorProps } from '../utils/nexStore';
import '../styles/NexStoreCard.css';

const OPEN_COUNT_KEY = 'nex-store-open-count';

const readOpenCount = () => {
    try {
        return Math.max(0, parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0', 10) || 0);
    } catch {
        return 0;
    }
};

const NexStoreCard = ({ variant = 'banner' }) => {
    const { success, error: showError, info } = useNotifications();
    const qrId = React.useId();
    const [showQr, setShowQr] = useState(false);
    const [qrImage, setQrImage] = useState('');
    const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
    const [openCount, setOpenCount] = useState(readOpenCount);

    useEffect(() => {
        const update = () => setOffline(navigator.onLine === false);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    useEffect(() => {
        if (!showQr) return undefined;
        let cancelled = false;
        QRCode.toDataURL(NEX_STORE_URL, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
            .then(url => { if (!cancelled) setQrImage(url); })
            .catch(() => { if (!cancelled) showError('Could not generate the QR code.'); });
        return () => { cancelled = true; };
    }, [showQr, showError]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(NEX_STORE_URL);
            success('NEX Store link copied to clipboard.');
        } catch {
            showError('Clipboard access was blocked. Use the open button instead.');
        }
    }, [success, showError]);

    const shareLink = useCallback(async () => {
        if (!navigator.share) {
            await copyLink();
            return;
        }
        try {
            await navigator.share({ title: NEX_STORE.name, text: NEX_STORE.tagline, url: NEX_STORE_URL });
        } catch (err) {
            // A user cancelling the native share sheet is not an error.
            if (err?.name !== 'AbortError') info('Share was cancelled; the link is still available to copy.');
        }
    }, [copyLink, info]);

    const recordOpen = useCallback(() => {
        setOpenCount(prev => {
            const next = prev + 1;
            try { localStorage.setItem(OPEN_COUNT_KEY, String(next)); } catch { /* storage disabled */ }
            return next;
        });
    }, []);

    const compact = variant === 'compact';

    return (
        <section
            className={`nex-store nex-store--${variant}`}
            aria-label="Featured link: NEX Store"
            data-nex-store-url={NEX_STORE_URL}
        >
            {!compact && (
                <div className="nex-store__intro">
                    <span className="nex-store__badge"><Store size={13} aria-hidden="true" /> {NEX_STORE.category}</span>
                    <h3 className="nex-store__title">{NEX_STORE.name}</h3>
                    <p className="nex-store__description">{NEX_STORE.description}</p>
                    <ul className="nex-store__features">
                        {NEX_STORE.features.map(feature => <li key={feature}>{feature}</li>)}
                    </ul>
                </div>
            )}

            <div className="nex-store__actions">
                <a
                    {...nexStoreAnchorProps}
                    className="nex-store__open cta-btn cta-btn-primary"
                    onClick={recordOpen}
                    aria-label={`Open ${NEX_STORE.name} in a new tab (external site)`}
                >
                    {!compact && <Store size={16} aria-hidden="true" />}
                    <span>Open NEX Store</span>
                    <ExternalLink size={15} aria-hidden="true" />
                </a>
                <button type="button" className="nex-store__action" onClick={copyLink} aria-label="Copy NEX Store link">
                    <Copy size={15} aria-hidden="true" /> <span>Copy link</span>
                </button>
                <button type="button" className="nex-store__action" onClick={shareLink} aria-label="Share NEX Store link">
                    <Share2 size={15} aria-hidden="true" /> <span>Share</span>
                </button>
                <button
                    type="button"
                    className="nex-store__action"
                    onClick={() => setShowQr(value => !value)}
                    aria-expanded={showQr}
                    aria-controls={qrId}
                >
                    <QrCode size={15} aria-hidden="true" /> <span>{showQr ? 'Hide QR' : 'QR code'}</span>
                </button>
            </div>

            {showQr && (
                <div className="nex-store__qr" id={qrId}>
                    {qrImage
                        ? <img src={qrImage} alt={`QR code for ${NEX_STORE_URL}`} width="220" height="220" />
                        : <span className="nex-store__hint">Generating QR code…</span>}
                    <p className="nex-store__hint">Scan to open {NEX_STORE_URL}</p>
                    <button type="button" className="nex-store__action" onClick={() => setShowQr(false)} aria-label="Close QR code">
                        <X size={14} aria-hidden="true" /> <span>Close</span>
                    </button>
                </div>
            )}

            <div className="nex-store__meta">
                {offline && (
                    <span className="nex-store__offline"><WifiOff size={13} aria-hidden="true" /> You appear to be offline — the external site may not load.</span>
                )}
                <span>Opens in a new tab · External site</span>
                {openCount > 0 && <span>Opened {openCount} {openCount === 1 ? 'time' : 'times'} from this browser</span>}
            </div>
        </section>
    );
};

export default NexStoreCard;

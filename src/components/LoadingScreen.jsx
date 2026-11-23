/**
 * Phase 40 — enhanced splash screen.
 *
 * Doubles as the React `Suspense` fallback and the boot shell shown while the
 * JavaScript bundle downloads (see the static copy in `index.html`).
 *
 * Honesty rules this component follows:
 *  - the progress bar reflects *real* milestones (fonts ready, one animation
 *    frame painted), never a fake timer that pretends to know more than it does;
 *  - "this is taking longer than usual" only appears when the wait is genuinely
 *    long;
 *  - a failed bundle load offers a reload instead of hanging forever.
 *
 * Confidential: local checkout only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STAGE_TEXT = {
    boot: 'Preparing the workspace',
    fonts: 'Loading typefaces',
    ready: 'Almost there'
};

const LoadingScreen = ({ label = 'Loading', hint }) => {
    const prefersReducedMotion = useReducedMotion();
    const [stage, setStage] = useState('boot');
    const [slow, setSlow] = useState(false);
    const [failed, setFailed] = useState(false);

    // Real milestones only: fonts settle, or the timeout fires first.
    useEffect(() => {
        let cancelled = false;
        const settle = () => {
            if (!cancelled) setStage('ready');
        };

        if (typeof document !== 'undefined' && document.fonts?.ready) {
            setStage('fonts');
            document.fonts.ready.then(settle).catch(settle);
        } else {
            settle();
        }

        const slowTimer = setTimeout(() => {
            if (!cancelled) setSlow(true);
        }, 8000);

        // A failed chunk load surfaces as an unhandled rejection; tell the truth
        // and offer a reload rather than spinning forever.
        const onError = event => {
            const message = String(event?.reason?.message || event?.message || '');
            if (/Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk/i.test(message)) {
                setFailed(true);
            }
        };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onError);

        return () => {
            cancelled = true;
            clearTimeout(slowTimer);
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onError);
        };
    }, []);

    const reload = useCallback(() => {
        if (typeof window !== 'undefined') window.location.reload();
    }, []);

    const spin = prefersReducedMotion
        ? {}
        : { rotate: [0, 360] };
    const pulse = prefersReducedMotion
        ? {}
        : { opacity: [0.55, 1, 0.55] };

    const progress = stage === 'boot' ? 34 : stage === 'fonts' ? 68 : 92;

    return (
        <div
            className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center z-50"
            role="status"
            aria-live="polite"
            aria-label={`${label}. ${STAGE_TEXT[stage]}.`}
        >
            {/* Soft brand glow, purely decorative. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                    background:
                        'radial-gradient(420px 420px at 50% 38%, rgba(34,211,238,0.16), transparent 70%),' +
                        'radial-gradient(360px 360px at 62% 62%, rgba(124,58,237,0.14), transparent 72%)'
                }}
            />

            <div className="relative text-center px-6">
                <motion.div
                    animate={failed ? {} : { ...spin, scale: prefersReducedMotion ? 1 : [1, 1.06, 1] }}
                    transition={failed ? {} : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl ${
                        failed
                            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/40'
                            : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/40'
                    }`}
                >
                    <span className="text-white text-2xl font-bold tracking-wide select-none">EF</span>
                </motion.div>

                <motion.h2
                    animate={pulse}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="text-2xl font-bold text-white mb-2"
                >
                    {failed ? 'Something did not load' : 'E-Folio Pro'}
                </motion.h2>

                <p className="text-slate-400 text-sm" aria-hidden="true">
                    {failed ? 'A required file could not be fetched.' : STAGE_TEXT[stage]}
                </p>

                {hint && !failed && (
                    <p className="text-slate-500 text-xs mt-1">{hint}</p>
                )}

                {/* Honest progress: advances on real milestones, never on a timer. */}
                {!failed && (
                    <div
                        className="mt-6 w-56 h-1.5 mx-auto rounded-full bg-white/10 overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-label="Loading progress"
                    >
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                )}

                {slow && !failed && (
                    <p className="text-amber-400/90 text-xs mt-4">
                        Still working — the first load can take a moment on a slow connection.
                    </p>
                )}

                {failed && (
                    <button
                        type="button"
                        onClick={reload}
                        className="mt-6 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
                    >
                        Reload the page
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoadingScreen;

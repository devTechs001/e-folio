// Developer-only diagnostics panel. Rendered ONLY in dev builds.
// Public production visitors never see status codes, endpoints or exception
// text; developers keep all of it here and in the console.
import React, { useEffect, useState } from 'react';
import { IS_DEV, getDevIssues } from '../utils/publicMessaging';
import '../styles/DevDiagnostics.css';

const DevDiagnostics = () => {
    const [open, setOpen] = useState(false);
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        if (!IS_DEV) return undefined;
        const refresh = () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            setIssues(getDevIssues());
        };
        refresh();
        const timer = setInterval(refresh, 2000);
        return () => clearInterval(timer);
    }, []);

    if (!IS_DEV) return null;

    return (
        <aside className="dev-diagnostics" aria-label="Developer diagnostics">
            <button type="button" className="dev-diagnostics__toggle" onClick={() => setOpen(v => !v)}>
                DEV · API {issues.length ? `${issues.length} issue${issues.length === 1 ? '' : 's'}` : 'OK'}
            </button>
            {open && (
                <div className="dev-diagnostics__body">
                    <p className="dev-diagnostics__hint">
                        Technical detail for developers only. Hidden in production builds.
                    </p>
                    {issues.length === 0 && <p className="dev-diagnostics__empty">No API failures recorded.</p>}
                    <ul>
                        {issues.slice().reverse().map((issue, index) => (
                            <li key={`${issue.at}-${index}`}>
                                <code>{issue.status || '—'}</code> {issue.section} <span>{issue.endpoint}</span>
                                <small>{issue.at}</small>
                                <em>{issue.message}</em>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
};

export default DevDiagnostics;

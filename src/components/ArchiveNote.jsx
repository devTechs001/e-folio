// A short, visitor-friendly note shown when a section uses its saved copy.
// It deliberately contains no status codes, exception text or backend detail.
import React from 'react';
import { PUBLIC_COPY } from '../utils/publicMessaging';
import '../styles/ArchiveNote.css';

const ArchiveNote = ({ source, className = '' }) => {
    if (source !== 'snapshot') return null;
    return <p className={`archive-note ${className}`.trim()}>{PUBLIC_COPY.archive}</p>;
};

export default ArchiveNote;

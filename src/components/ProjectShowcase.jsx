// Verified external project links shown in the public Projects section.
//
// Data comes from src/data/projectShowcase.json — a single shared file also
// used by the MongoDB seeder. Nothing here invents statistics, replaces an
// existing project link, and it reads no browser-stored counters.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, ShieldCheck, WifiOff } from 'lucide-react';
import {
    PROJECT_SHOWCASE,
    showcaseAnchorProps,
    showcaseShareUrl
} from '../utils/projectShowcase';
import '../styles/ProjectShowcase.css';

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

const ShowcaseCard = ({ project }) => {
    const [copied, setCopied] = useState(false);
    const [online, setOnline] = useState(isOnline);
    const anchor = showcaseAnchorProps(project);

    useEffect(() => {
        const update = () => setOnline(isOnline());
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    useEffect(() => {
        if (!copied) return undefined;
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(showcaseShareUrl(project));
            setCopied(true);
        } catch {
            // Clipboard can be blocked by the browser; the open link still works.
            setCopied(false);
        }
    }, [project]);

    return (
        <article className="showcase-card" data-project-slug={project.slug}>
            <span className="showcase-card__badge">{project.label}</span>
            <h3 className="showcase-card__title">{project.title}</h3>
            <p className="showcase-card__description">{project.description}</p>

            <ul className="showcase-card__features">
                {project.features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>

            <div className="showcase-card__security">
                <p className="showcase-card__security-heading">
                    <ShieldCheck size={15} aria-hidden="true" /> As described on the live page
                </p>
                <ul>
                    {project.securityNotes.map(note => <li key={note}>{note}</li>)}
                </ul>
            </div>

            <div className="showcase-card__actions">
                <a {...anchor} className="showcase-card__open">
                    Open client portal <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <button
                    type="button"
                    className="showcase-card__copy"
                    onClick={copyLink}
                    aria-label={`Copy the link to ${project.title}`}
                >
                    {copied
                        ? <><Check size={15} aria-hidden="true" /> Copied</>
                        : <><Copy size={15} aria-hidden="true" /> Copy link</>}
                </button>
            </div>

            {!online && (
                <p className="showcase-card__offline">
                    <WifiOff size={14} aria-hidden="true" /> This link opens an external site and you appear to be offline.
                </p>
            )}

            <a {...anchor} className="showcase-card__url">{project.url}</a>
        </article>
    );
};

const ProjectShowcase = ({ compact = false }) => {
    if (PROJECT_SHOWCASE.length === 0) return null;
    return (
        <div
            className={`showcase-grid${compact ? ' showcase-grid--compact' : ''}`}
            aria-label="Featured external project links"
        >
            {PROJECT_SHOWCASE.map(project => (
                <ShowcaseCard key={project.slug} project={project} />
            ))}
        </div>
    );
};

export default ProjectShowcase;

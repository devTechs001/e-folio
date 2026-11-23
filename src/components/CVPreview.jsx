import React from 'react';
import '../styles/CVPreview.css';

/**
 * Single CV renderer.
 *
 * The dashboard preview, the public `/cv/:username` page and the holder's
 * "view as visitor" all render through this component, so what someone writes
 * is exactly what a visitor sees. It reads only fields that exist on the
 * document — no placeholder person, no invented entries.
 *
 * `variant` comes from `settings.template` (modern | classic | minimal |
 * creative | professional) and only changes layout/accent, never content.
 */
const visible = list => (Array.isArray(list) ? list.filter(item => item && item.visible !== false) : []);
const text = value => (value === undefined || value === null ? '' : String(value).trim());

const skillGroups = skills => {
    if (!skills || typeof skills !== 'object' || Array.isArray(skills)) return [];
    return Object.entries(skills)
        .map(([name, items]) => ({ name, items: Array.isArray(items) ? items.filter(Boolean) : [] }))
        .filter(group => group.items.length > 0);
};

const Section = ({ title, accent, children, className = '' }) => (
    <section className={`cvp-section ${className}`.trim()}>
        <h3 className="cvp-section-title" style={{ color: accent }}>{title}</h3>
        {children}
    </section>
);

const CVPreview = ({ cv, variant, accent, fontFamily, scale = 'full', className = '' }) => {
    const doc = cv && typeof cv === 'object' ? cv : {};
    const settings = doc.settings || {};
    const template = variant || settings.template || 'modern';
    const primary = accent || settings.primaryColor || '#2563eb';
    const font = fontFamily || settings.fontFamily || 'Inter, sans-serif';
    const personal = doc.personalInfo || {};

    const experience = visible(doc.experience);
    const education = visible(doc.education);
    const projects = visible(doc.projects);
    const achievements = visible(doc.achievements);
    const certifications = visible(doc.certifications);
    const languages = visible(doc.languages);
    const links = visible(doc.links).filter(link => text(link.url));
    const skills = skillGroups(doc.skills);

    const contactItems = [
        personal.email, personal.phone, personal.location, personal.website,
        personal.github, personal.linkedin
    ].map(text).filter(Boolean);

    const skillPanel = skills.length > 0 && (
        <Section title="Skills" accent={primary} className="cvp-skills">
            {skills.map(group => (
                <div className="cvp-skill-group" key={group.name}>
                    <h4 className="cvp-skill-name">{group.name}</h4>
                    <div className="cvp-chips">
                        {group.items.map((item, index) => (
                            <span className="cvp-chip" key={`${item}-${index}`}>{item}</span>
                        ))}
                    </div>
                </div>
            ))}
        </Section>
    );

    const educationPanel = education.length > 0 && (
        <Section title="Education" accent={primary}>
            {education.map((item, index) => (
                <div className="cvp-entry" key={item.id || index}>
                    <h4 className="cvp-entry-title">{text(item.degree)}</h4>
                    <p className="cvp-entry-sub">{text(item.institution)}</p>
                    {(text(item.period) || text(item.details)) && (
                        <p className="cvp-entry-meta">
                            {[text(item.period), text(item.details)].filter(Boolean).join(' — ')}
                        </p>
                    )}
                </div>
            ))}
        </Section>
    );

    const certificationPanel = certifications.length > 0 && (
        <Section title="Certifications" accent={primary}>
            {certifications.map((item, index) => (
                <div className="cvp-entry" key={item.id || index}>
                    <h4 className="cvp-entry-title">{text(item.name)}</h4>
                    {(text(item.issuer) || text(item.period)) && (
                        <p className="cvp-entry-meta">
                            {[text(item.issuer), text(item.period)].filter(Boolean).join(' · ')}
                        </p>
                    )}
                    {text(item.credentialUrl) && (
                        <a className="cvp-entry-link" href={item.credentialUrl} target="_blank" rel="noopener noreferrer">
                            View credential
                        </a>
                    )}
                </div>
            ))}
        </Section>
    );

    const languagePanel = languages.length > 0 && (
        <Section title="Languages" accent={primary}>
            <ul className="cvp-language-list">
                {languages.map((item, index) => (
                    <li key={item.id || index}>
                        <span>{text(item.name)}</span>
                        {text(item.level) && <em>{text(item.level)}</em>}
                    </li>
                ))}
            </ul>
        </Section>
    );

    const achievementPanel = achievements.length > 0 && (
        <Section title="Achievements" accent={primary}>
            <ul className="cvp-achievement-list">
                {achievements.map((item, index) => (
                    <li key={item.id || index} style={{ borderLeftColor: primary }}>
                        {text(item.text)}
                    </li>
                ))}
            </ul>
        </Section>
    );

    const linkPanel = links.length > 0 && (
        <Section title="Links" accent={primary}>
            <ul className="cvp-link-list">
                {links.map((item, index) => (
                    <li key={item.id || index}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {text(item.label) || item.url}
                        </a>
                    </li>
                ))}
            </ul>
        </Section>
    );

    const experiencePanel = experience.length > 0 && (
        <Section title="Experience" accent={primary}>
            {experience.map((item, index) => {
                const technologies = Array.isArray(item.technologies) ? item.technologies.filter(Boolean) : [];
                return (
                    <article className="cvp-entry" key={item.id || index}>
                        <div className="cvp-entry-head">
                            <div>
                                <h4 className="cvp-entry-title">{text(item.title)}</h4>
                                {text(item.company) && (
                                    <p className="cvp-entry-sub" style={{ color: primary }}>{text(item.company)}</p>
                                )}
                            </div>
                            <div className="cvp-entry-side">
                                {text(item.period) && <span>{text(item.period)}</span>}
                                {text(item.location) && <span>{text(item.location)}</span>}
                            </div>
                        </div>
                        {text(item.description) && <p className="cvp-entry-body">{text(item.description)}</p>}
                        {technologies.length > 0 && (
                            <div className="cvp-chips cvp-chips--tight">
                                {technologies.map((tech, techIndex) => (
                                    <span className="cvp-chip" key={`${tech}-${techIndex}`}>{tech}</span>
                                ))}
                            </div>
                        )}
                    </article>
                );
            })}
        </Section>
    );

    const projectPanel = projects.length > 0 && (
        <Section title="Projects" accent={primary}>
            {projects.map((item, index) => {
                const technologies = Array.isArray(item.technologies) ? item.technologies.filter(Boolean) : [];
                const highlights = Array.isArray(item.highlights) ? item.highlights.filter(Boolean) : [];
                return (
                    <article className="cvp-entry" key={item.id || index}>
                        <h4 className="cvp-entry-title">
                            {text(item.url) ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer">{text(item.name)}</a>
                            ) : text(item.name)}
                        </h4>
                        {text(item.description) && <p className="cvp-entry-body">{text(item.description)}</p>}
                        {highlights.length > 0 && (
                            <ul className="cvp-highlight-list">
                                {highlights.map((highlight, highlightIndex) => (
                                    <li key={`${highlight}-${highlightIndex}`}>{highlight}</li>
                                ))}
                            </ul>
                        )}
                        {technologies.length > 0 && (
                            <div className="cvp-chips cvp-chips--tight">
                                {technologies.map((tech, techIndex) => (
                                    <span className="cvp-chip" key={`${tech}-${techIndex}`}>{tech}</span>
                                ))}
                            </div>
                        )}
                    </article>
                );
            })}
        </Section>
    );

    const initials = text(personal.name).charAt(0).toUpperCase();

    return (
        <div
            className={`cvp cvp--${template} cvp--${scale} ${className}`.trim()}
            style={{ '--cvp-accent': primary, fontFamily: font }}
        >
            <header className="cvp-header">
                <div className="cvp-identity">
                    <div
                        className="cvp-avatar"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${primary}99)` }}
                        aria-hidden="true"
                    >
                        {initials || '·'}
                    </div>
                    <div className="cvp-headline">
                        <h1 className="cvp-name">{text(personal.name) || 'Your name'}</h1>
                        {text(personal.title) && <p className="cvp-title">{text(personal.title)}</p>}
                        {text(personal.bio) && <p className="cvp-bio">{text(personal.bio)}</p>}
                    </div>
                </div>
                {contactItems.length > 0 && (
                    <ul className="cvp-contact">
                        {contactItems.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                        ))}
                    </ul>
                )}
            </header>

            <div className="cvp-body">
                <div className="cvp-main">
                    {experiencePanel}
                    {projectPanel}
                    {template === 'classic' && achievementPanel}
                </div>
                <aside className="cvp-side">
                    {skillPanel}
                    {educationPanel}
                    {certificationPanel}
                    {languagePanel}
                    {template !== 'classic' && achievementPanel}
                    {linkPanel}
                </aside>
            </div>
        </div>
    );
};

export default CVPreview;

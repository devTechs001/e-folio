import React, { useMemo, useState } from 'react';
import './../styles/ProjectsExperience.css';

/**
 * Phase 23 — the Projects page experience layer.
 *
 * Every number, label and link below is derived from the records already
 * published in src/data/publicSnapshot.json. Nothing is invented, fetched or
 * sent anywhere. The project card components are deliberately NOT used here:
 * the owner asked for the card interface to stay exactly as it is.
 *
 * All hooks are declared before any effect that reads them, so no dependency
 * array can hit the temporal dead zone (see tests/hook-dependency-order.test.mjs).
 */
const countBy = (records, key) => {
    const counts = new Map();
    for (const record of records) {
        for (const value of record[key] || []) {
            if (!value) continue;
            counts.set(value, (counts.get(value) || 0) + 1);
        }
    }
    return [...counts.entries()]
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

const yearOf = record => {
    const date = new Date(record.completionDate || 0);
    return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

const MAX_COMPARE = 3;

const ProjectsExperience = ({
    projects,
    filtered,
    categories,
    filter,
    onCategoryChange,
    selectedTechs,
    onTechToggle,
    selectedTags,
    onTagToggle,
    favorites,
    showFavoritesOnly,
    onToggleFavoritesOnly,
    onOpenProject,
    onCopyView,
    copiedView,
    onSurpriseMe,
    onResetFilters,
    onBackToTop
}) => {
    const [showCompare, setShowCompare] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showAllTech, setShowAllTech] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);
    const [compareIds, setCompareIds] = useState([]);
    const [activePanel, setActivePanel] = useState('spotlight');

    const categoryCounts = useMemo(() => {
        return categories
            .filter(category => category !== 'all')
            .map(category => ({
                name: category,
                count: projects.filter(p => p.category === category).length
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [categories, projects]);

    const technologyCounts = useMemo(() => countBy(projects, 'technologies'), [projects]);
    const tagCounts = useMemo(() => countBy(projects, 'tags'), [projects]);

    const spotlight = useMemo(() => {
        const featured = projects.filter(p => p.featured && p.imageUrl);
        return featured[0] || projects.find(p => p.imageUrl) || projects[0] || null;
    }, [projects]);

    const metrics = useMemo(() => {
        const technologyTotal = technologyCounts.length;
        const categoryTotal = categoryCounts.length;
        const tagTotal = tagCounts.length;
        const years = [...new Set(projects.map(yearOf).filter(Boolean))].sort();
        const averageTech = projects.length
            ? (projects.reduce((sum, p) => sum + (p.technologies || []).length, 0) / projects.length).toFixed(1)
            : null;
        return [
            { label: 'Projects', value: projects.length },
            { label: 'Featured', value: projects.filter(p => p.featured).length },
            { label: 'Categories', value: categoryTotal },
            { label: 'Technologies', value: technologyTotal },
            { label: 'Tags', value: tagTotal },
            { label: 'Years active', value: years.length ? `${years[0]}–${years[years.length - 1]}` : null },
            { label: 'Avg. stack size', value: averageTech }
        ].filter(metric => metric.value !== null && metric.value !== 0 && metric.value !== '0.0');
    }, [projects, technologyCounts, categoryCounts, tagCounts]);

    const recentlyCompleted = useMemo(() => {
        return [...projects]
            .filter(p => p.completionDate)
            .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))
            .slice(0, 3);
    }, [projects]);

    const timeline = useMemo(() => {
        const groups = new Map();
        for (const record of projects) {
            const year = yearOf(record);
            if (!year) continue;
            if (!groups.has(year)) groups.set(year, []);
            groups.get(year).push(record);
        }
        return [...groups.entries()].sort((a, b) => b[0] - a[0]);
    }, [projects]);

    const comparison = useMemo(() => {
        return compareIds
            .map(id => projects.find(p => p.id === id))
            .filter(Boolean);
    }, [compareIds, projects]);

    const toggleCompare = id => {
        setCompareIds(prev => {
            if (prev.includes(id)) return prev.filter(item => item !== id);
            if (prev.length >= MAX_COMPARE) return prev;
            return [...prev, id];
        });
    };

    const visibleTech = showAllTech ? technologyCounts : technologyCounts.slice(0, 12);
    const visibleTags = showAllTags ? tagCounts : tagCounts.slice(0, 12);
    const hasActiveFilters = selectedTechs.length > 0 || selectedTags.length > 0
        || filter !== 'all' || showFavoritesOnly;

    if (!projects.length) return null;

    return (
        <div className="px-experience" aria-label="Portfolio explorer">
            {/* ---------------------------- top-section headings ---------------------------- */}
            <div className="px-hero-headings">
                <span className="px-eyebrow">
                    <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                    Portfolio · {projects.length} projects
                </span>
                <h3 className="px-heading">Portfolio at a glance</h3>
                <p className="px-lede">
                    Real work, real links and real stacks — browse the catalogue by
                    category, technology, tag or year.
                </p>
            </div>

            <dl className="px-metrics" aria-label="Portfolio metrics">
                {metrics.map(metric => (
                    <div className="px-metric" key={metric.label}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                    </div>
                ))}
            </dl>

            {/* --------------------------------- spotlight -------------------------------- */}
            <section className="px-panel" aria-labelledby="px-featured-heading">
                <div className="px-panel__head">
                    <h3 className="px-heading" id="px-featured-heading">Featured work</h3>
                    <div className="px-tabs" role="tablist" aria-label="Featured panels">
                        {[
                            ['spotlight', 'Spotlight'],
                            ['recent', 'Recently completed'],
                            ['browse', 'Browse by category']
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={activePanel === key}
                                className={`px-tab ${activePanel === key ? 'active' : ''}`}
                                onClick={() => setActivePanel(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {activePanel === 'spotlight' && spotlight && (
                    <article className="px-spotlight">
                        <div className="px-spotlight__media">
                            <img src={spotlight.imageUrl} alt="" loading="lazy" />
                        </div>
                        <div className="px-spotlight__body">
                            <span className="px-badge">{spotlight.category || 'Project'}</span>
                            <h4>{spotlight.title}</h4>
                            <p>{spotlight.description}</p>
                            <ul className="px-chips" aria-label="Technologies">
                                {(spotlight.technologies || []).slice(0, 6).map(tech => (
                                    <li key={tech}>{tech}</li>
                                ))}
                            </ul>
                            <div className="px-actions">
                                <button type="button" className="px-btn px-btn--primary" onClick={() => onOpenProject(spotlight)}>
                                    <i className="fa-solid fa-circle-info" aria-hidden="true"></i> View details
                                </button>
                                {spotlight.links?.live && (
                                    <a className="px-btn" href={spotlight.links.live} target="_blank" rel="noreferrer">
                                        <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Open project
                                    </a>
                                )}
                            </div>
                        </div>
                    </article>
                )}

                {activePanel === 'recent' && (
                    <ol className="px-recent">
                        {recentlyCompleted.map(record => (
                            <li key={record.id}>
                                <button type="button" onClick={() => onOpenProject(record)}>
                                    <span className="px-recent__title">{record.title}</span>
                                    <span className="px-recent__date">
                                        {new Date(record.completionDate).toLocaleDateString()}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                )}

                {activePanel === 'browse' && (
                    <div className="px-categories">
                        {categoryCounts.map(entry => (
                            <button
                                type="button"
                                key={entry.name}
                                className={`px-category ${filter === entry.name ? 'active' : ''}`}
                                onClick={() => onCategoryChange(filter === entry.name ? 'all' : entry.name)}
                                aria-pressed={filter === entry.name}
                            >
                                <span className="px-category__name">{entry.name}</span>
                                <span className="px-category__count">{entry.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* ------------------------------- discovery tools ---------------------------- */}
            <section className="px-panel" aria-labelledby="px-explore-heading">
                <div className="px-panel__head">
                    <h3 className="px-heading" id="px-explore-heading">Explore the catalogue</h3>
                    <span className="px-hint">Every count comes from the published project records</span>
                </div>

                <div className="px-discovery">
                    <div className="px-discovery__block">
                        <h4 className="px-subheading">Technology index</h4>
                        <div className="px-chip-grid">
                            {visibleTech.map(([tech, count]) => (
                                <button
                                    key={tech}
                                    type="button"
                                    className={`px-chip ${selectedTechs.includes(tech) ? 'active' : ''}`}
                                    aria-pressed={selectedTechs.includes(tech)}
                                    onClick={() => onTechToggle(tech)}
                                >
                                    {tech}<span>{count}</span>
                                </button>
                            ))}
                        </div>
                        {technologyCounts.length > 12 && (
                            <button type="button" className="px-link-btn" onClick={() => setShowAllTech(v => !v)}>
                                {showAllTech ? 'Show fewer technologies' : `Show all ${technologyCounts.length} technologies`}
                            </button>
                        )}
                    </div>

                    <div className="px-discovery__block">
                        <h4 className="px-subheading">Popular tags</h4>
                        <div className="px-chip-grid">
                            {visibleTags.map(([tag, count]) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`px-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    aria-pressed={selectedTags.includes(tag)}
                                    onClick={() => onTagToggle(tag)}
                                >
                                    {tag}<span>{count}</span>
                                </button>
                            ))}
                        </div>
                        {tagCounts.length > 12 && (
                            <button type="button" className="px-link-btn" onClick={() => setShowAllTags(v => !v)}>
                                {showAllTags ? 'Show fewer tags' : `Show all ${tagCounts.length} tags`}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ------------------------------- quick actions ----------------------------- */}
            <section className="px-panel" aria-labelledby="px-tools-heading">
                <div className="px-panel__head">
                    <h3 className="px-heading" id="px-tools-heading">Tools &amp; shortcuts</h3>
                    <p className="px-result-count" aria-live="polite">
                        Showing {filtered.length} of {projects.length} projects
                        {hasActiveFilters ? ' with your filters' : ''}
                    </p>
                </div>
                <div className="px-toolbar">
                    <button type="button" className="px-btn" onClick={onToggleFavoritesOnly} aria-pressed={showFavoritesOnly}>
                        <i className="fa-regular fa-star" aria-hidden="true"></i>
                        {showFavoritesOnly ? 'All projects' : `Favourites${favorites.length ? ` (${favorites.length})` : ''}`}
                    </button>
                    <button type="button" className="px-btn" onClick={onSurpriseMe} disabled={!projects.length}>
                        <i className="fa-solid fa-shuffle" aria-hidden="true"></i> Surprise me
                    </button>
                    <button type="button" className="px-btn" onClick={() => setShowCompare(v => !v)} aria-expanded={showCompare}>
                        <i className="fa-solid fa-table-columns" aria-hidden="true"></i> Compare{comparison.length ? ` (${comparison.length})` : ''}
                    </button>
                    <button type="button" className="px-btn" onClick={() => setShowTimeline(v => !v)} aria-expanded={showTimeline}>
                        <i className="fa-solid fa-timeline" aria-hidden="true"></i> Timeline
                    </button>
                    <button type="button" className="px-btn" onClick={onCopyView}>
                        <i className="fa-solid fa-link" aria-hidden="true"></i> {copiedView ? 'Link copied' : 'Copy this view'}
                    </button>
                    <button type="button" className="px-btn" onClick={onResetFilters} disabled={!hasActiveFilters}>
                        <i className="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset filters
                    </button>
                    <button type="button" className="px-btn" onClick={onBackToTop}>
                        <i className="fa-solid fa-arrow-up" aria-hidden="true"></i> Back to top
                    </button>
                </div>
                <p className="px-hint px-hint--keys">
                    <kbd>/</kbd> focuses search · <kbd>Esc</kbd> closes a project or clears the search ·
                    filters are shareable through “Copy this view”.
                </p>
            </section>

            {/* --------------------------------- compare ---------------------------------- */}
            {showCompare && (
                <section className="px-panel" aria-labelledby="px-compare-heading">
                    <h3 className="px-heading" id="px-compare-heading">Compare projects</h3>
                    <p className="px-hint">Pick up to {MAX_COMPARE} projects. Only published fields are compared.</p>
                    <div className="px-compare-picker">
                        {projects.map(record => (
                            <label key={record.id} className="px-compare-option">
                                <input
                                    type="checkbox"
                                    checked={compareIds.includes(record.id)}
                                    disabled={!compareIds.includes(record.id) && compareIds.length >= MAX_COMPARE}
                                    onChange={() => toggleCompare(record.id)}
                                />
                                <span>{record.title}</span>
                            </label>
                        ))}
                    </div>
                    {comparison.length > 0 && (
                        <div className="px-table-wrap">
                            <table className="px-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Field</th>
                                        {comparison.map(record => <th scope="col" key={record.id}>{record.title}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ['Category', r => r.category],
                                        ['Status', r => r.status],
                                        ['Technologies', r => (r.technologies || []).join(', ')],
                                        ['Tags', r => (r.tags || []).join(', ')],
                                        ['Views', r => r.views],
                                        ['Likes', r => r.likes],
                                        ['Team size', r => r.teamSize],
                                        ['Duration', r => r.duration],
                                        ['Completed', r => r.completionDate ? new Date(r.completionDate).toLocaleDateString() : '']
                                    ].map(([label, read]) => (
                                        <tr key={label}>
                                            <th scope="row">{label}</th>
                                            {comparison.map(record => {
                                                const value = read(record);
                                                return <td key={record.id}>{value || ''}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* --------------------------------- timeline --------------------------------- */}
            {showTimeline && (
                <section className="px-panel" aria-labelledby="px-timeline-heading">
                    <h3 className="px-heading" id="px-timeline-heading">Project timeline</h3>
                    {timeline.length === 0 ? (
                        <p className="px-hint">No completion dates are published yet.</p>
                    ) : (
                        <ol className="px-timeline">
                            {timeline.map(([year, records]) => (
                                <li key={year}>
                                    <h4 className="px-subheading">{year} <span>{records.length}</span></h4>
                                    <ul>
                                        {records.map(record => (
                                            <li key={record.id}>
                                                <button type="button" onClick={() => onOpenProject(record)}>
                                                    {record.title}
                                                    <span>{record.category || ''}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            )}
        </div>
    );
};

export default ProjectsExperience;

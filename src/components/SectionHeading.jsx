import React from 'react';
import '../styles/SectionHeading.css';

/**
 * Shared, centred section heading for the public pages.
 *
 * The decoration is the one from the hobbies/interests heading: an animated
 * gradient line with two pulsing dots. It is rebuilt here as pure CSS so every
 * public page can use the same treatment without pulling in the hobbies
 * stylesheet or its background effects.
 *
 * The title is rendered with the real wording split across two spans, so the
 * accent half keeps the existing gradient text: pass `accent` for the words
 * that should be tinted.
 *
 * @param {string}   text      The full heading text (used for the accessible name).
 * @param {string}   accent    The words inside `text` that get the gradient.
 * @param {string}   lede      Optional supporting sentence under the heading.
 * @param {string}   eyebrow   Optional small label above the heading.
 * @param {number}   level     Heading level, 2 by default (pages own their h1).
 * @param {string}   className Extra class names for layout tweaks.
 */
const SectionHeading = ({
    text,
    accent = '',
    lede = '',
    eyebrow = '',
    level = 2,
    className = '',
    children
}) => {
    const Heading = `h${level}`;

    // Keep the words in their original order: split on the accent phrase so a
    // page never has to hand-write the two halves and risk them drifting.
    const index = accent ? text.indexOf(accent) : -1;
    const before = index > -1 ? text.slice(0, index) : text;
    const after = index > -1 ? text.slice(index + accent.length) : '';

    return (
        <div className={`sec-head text-center ${className}`.trim()}>
            {eyebrow && <span className="sec-head__eyebrow">{eyebrow}</span>}

            <Heading className="sec-head__title">
                <span className="sec-head__text">{before}</span>
                {index > -1 && (
                    <span className="sec-head__accent">{accent}</span>
                )}
                {after && <span className="sec-head__text">{after}</span>}
            </Heading>

            {/* Decoration borrowed from the hobbies heading. */}
            <div className="sec-head__deco" aria-hidden="true">
                <span className="sec-head__dot sec-head__dot--left" />
                <span className="sec-head__line" />
                <span className="sec-head__dot sec-head__dot--right" />
            </div>

            {lede && <p className="sec-head__lede">{lede}</p>}
            {children}
        </div>
    );
};

export default SectionHeading;

import React, { useEffect, useRef, useState } from 'react';
import '../styles/WelcomeTag3D.css';

/**
 * "Welcome to my portfolio" — a CSS-3D animated wordmark.
 *
 * Pure CSS transforms (no WebGL, no new dependency), so it stays cheap on
 * mobile and behind the preview proxy. The letters rotate around the Y axis
 * with a staggered delay, giving a wave of depth rather than a flat fade.
 * `role="heading"` keeps the exact wording in the accessibility tree and in
 * the HTML for search engines, while the decorative letter shells are hidden
 * from assistive tech.
 *
 * Motion respects `prefers-reduced-motion`: the 3D wave stops and the text
 * renders flat and static (never invisible).
 */
const DEFAULT_TEXT = 'Welcome to my portfolio';

const splitWords = (text) =>
  String(text || DEFAULT_TEXT)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const WelcomeTag3D = ({
  text = DEFAULT_TEXT,
  as: HeadingTag = 'p',
  className = '',
  tone = 'gradient'
}) => {
  const rootRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Start the wave only when the tag is visible: the About section sits below
  // the fold on phones, so animating from page load would be wasted work.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const words = splitWords(text);
  let letterIndex = -1;

  return (
    <div
      ref={rootRef}
      className={`welcome-3d welcome-3d--${tone} ${inView ? 'is-live' : ''} ${className}`.trim()}
      data-in-view={inView ? 'true' : 'false'}
    >
      <span className="welcome-3d__scene">
        <HeadingTag className="welcome-3d__text" aria-label={text}>
          {words.map((word, wordIdx) => (
            <span className="welcome-3d__word" key={`${word}-${wordIdx}`}>
              {Array.from(word).map((char, charIdx) => {
                letterIndex += 1;
                const style = { '--letter-index': letterIndex };
                return (
                  <span
                    key={`${char}-${charIdx}`}
                    className="welcome-3d__letter"
                    style={style}
                    aria-hidden="true"
                  >
                    <span className="welcome-3d__face welcome-3d__face--front">{char}</span>
                    <span className="welcome-3d__face welcome-3d__face--back">{char}</span>
                    <span className="welcome-3d__face welcome-3d__face--side">{char}</span>
                  </span>
                );
              })}
            </span>
          ))}
        </HeadingTag>
      </span>
      <span className="welcome-3d__floor" aria-hidden="true" />
    </div>
  );
};

export default WelcomeTag3D;

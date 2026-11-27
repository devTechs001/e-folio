/**
 * Phase 43 — the About hero name tag and the welcome wordmark were too small.
 * Phase 48 — the owner asked for both to be larger again, so the scale was
 * raised ~13%. The guarantees below are unchanged in kind: every step still has
 * to grow across breakpoints, the name still has to outrank the global section
 * scale, and the welcome line still has to stay smaller than the name.
 *
 * The name inherited the global section-heading scale and was then overridden
 * *down* to 4.25rem at 1280px+, so the owner's own name rendered smaller than an
 * ordinary page heading. The 3D welcome wordmark topped out at 2.15rem, reading
 * as a caption instead of a hero label.
 *
 * These checks assert the new sizes are genuinely larger at every breakpoint,
 * stay ordered across breakpoints, and cannot reintroduce the regressions that
 * caused the originals to be small (the downward override, and the pill that
 * used to overflow its container).
 *
 * Node-only static checks: no framework, no browser, no network.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const rem = value => parseFloat(value);

/** Every `font-size: Xrem;` declared for the About heading, in file order. */
const nameSizes = css => [...css.matchAll(/\.about-section \.about-heading \.sec-head__title \{\s*font-size: ([\d.]+)rem;/g)]
    .map(match => rem(match[1]));

/** The five `--sec-head-size` steps of the global heading scale, in order. */
const globalSteps = css => [...css.matchAll(/font-size: var\(--sec-head-size, ([\d.]+)rem\);/g)]
    .map(match => rem(match[1]));

/* --------------------------------- name tag -------------------------------- */

check('the name is larger than before at every breakpoint', () => {
    const sizes = nameSizes(read('src/styles/About.css'));
    // base, 640, 768, 1024, 1280
    assert.equal(sizes.length, 5, `expected 5 steps, found ${sizes.length}: ${sizes}`);
    // Phase 43 baseline was 2.5rem / 4.25rem; Phase 48 raised it again.
    assert.ok(sizes[0] > 2.5, `${sizes[0]}rem is not larger than the old 2.5rem`);
    assert.ok(sizes[4] > 4.25, `${sizes[4]}rem is not larger than the old 4.25rem`);
    // The Phase 48 values, pinned so a later edit cannot quietly shrink them back.
    assert.deepEqual(sizes, [3.3, 3.9, 4.6, 5.6, 6.4]);
    // Every step must grow as the viewport grows.
    for (let i = 1; i < sizes.length; i += 1) {
        assert.ok(sizes[i] > sizes[i - 1], `step ${i + 1} (${sizes[i]}) does not grow`);
    }
});

check('the name outranks the global heading scale at every breakpoint', () => {
    const sizes = nameSizes(read('src/styles/About.css'));
    const global = globalSteps(read('src/styles/SectionHeading.css'));
    assert.equal(global.length, 5);
    // The regression: the name was overridden DOWN to 4.25rem, smaller than a
    // normal page heading. Each name step must now exceed its global peer.
    for (let i = 0; i < 5; i += 1) {
        assert.ok(
            sizes[i] > global[i],
            `name ${sizes[i]}rem must exceed the global ${global[i]}rem at step ${i + 1}`
        );
    }
});

check('the old downward override is gone', () => {
    const css = read('src/styles/About.css');
    // The exact rule that shrank the name below the section scale.
    assert.doesNotMatch(
        css,
        /@media \(min-width: 1280px\) \{\s*\.about-section \.about-heading \.sec-head__title \{\s*font-size: 4\.25rem;/
    );
});

check('a long name wraps instead of widening the column', () => {
    const css = read('src/styles/About.css');
    const block = css.slice(
        css.indexOf('.about-section .about-heading .sec-head__title {'),
        css.indexOf('.about-section .about-heading .sec-head__title {') + 400
    );
    assert.match(block, /overflow-wrap: break-word;/);
    assert.match(block, /word-break: break-word;/);
    // Tight leading prevents the larger glyphs from crashing into the next line.
    assert.match(block, /line-height: 1\.08;/);
    // Phase 48 — larger type needs the flex column to be allowed to shrink.
    const heading = read('src/styles/About.css');
    assert.match(heading, /\.about-section \.about-heading \{[^}]*min-width: 0;/);
});

/* ------------------------------- welcome tag ------------------------------- */

check('the welcome wordmark is larger at every breakpoint', () => {
    const css = read('src/styles/WelcomeTag3D.css');
    const main = css.match(/--welcome-size: clamp\(([\d.]+)rem, ([\d.]+)vw, ([\d.]+)rem\)/);
    assert.ok(main, 'the welcome size clamp is missing');
    // Was clamp(1.35rem, 3.6vw, 2.15rem).
    assert.ok(rem(main[1]) > 1.35, `floor ${main[1]}rem did not grow`);
    assert.ok(rem(main[2]) > 3.6, `mid ${main[2]}vw did not grow`);
    assert.ok(rem(main[3]) > 2.15, `ceiling ${main[3]}rem did not grow`);
    // Phase 48: was clamp(1.85rem, 4.6vw, 3.1rem).
    assert.deepEqual([rem(main[1]), rem(main[2]), rem(main[3])], [2.1, 5.2, 3.7]);

    // Narrow phones: was clamp(1.2rem, 6.2vw, 1.6rem).
    const narrow = css.slice(css.indexOf('@media (max-width: 420px)'));
    const phone = narrow.match(/--welcome-size: clamp\(([\d.]+)rem, ([\d.]+)vw, ([\d.]+)rem\)/);
    assert.ok(phone, 'the narrow-phone clamp is missing');
    assert.ok(rem(phone[1]) > 1.2, `phone floor ${phone[1]}rem did not grow`);
    assert.ok(rem(phone[3]) > 1.6, `phone ceiling ${phone[3]}rem did not grow`);
    // Phase 48: was clamp(1.55rem, 7.4vw, 2rem).
    assert.deepEqual([rem(phone[1]), rem(phone[2]), rem(phone[3])], [1.75, 8.2, 2.3]);
});

check('the welcome wordmark still reads smaller than the name', () => {
    const welcome = read('src/styles/WelcomeTag3D.css')
        .match(/--welcome-size: clamp\([\d.]+rem, [\d.]+vw, ([\d.]+)rem\)/);
    const sizes = nameSizes(read('src/styles/About.css'));
    // Hierarchy: the name stays the hero, the welcome line introduces it.
    assert.ok(rem(welcome[1]) < sizes[4], 'the welcome line must not outweigh the name');
});

check('the welcome wordmark keeps its motion and accessibility contracts', () => {
    const css = read('src/styles/WelcomeTag3D.css');
    const component = read('src/components/WelcomeTag3D.jsx');
    for (const token of ['prefers-reduced-motion', 'focus-visible']) {
        assert.ok(css.includes(token), `${token} handling is missing`);
    }
    for (const face of ['front', 'back', 'side']) {
        assert.ok(component.includes(`welcome-3d__face--${face}`), `missing ${face} face`);
    }
    // Still a CSS-only transform: no animation library was introduced.
    assert.doesNotMatch(component, /framer-motion/);
});

/* ------------------------------- no collateral ----------------------------- */

check('no protected surface was touched by the resize', () => {
    const about = read('src/styles/About.css');
    // The availability pill keeps its own contained size; enlarging it is what
    // made it overflow its rounded container in an earlier phase.
    const pill = about.slice(about.indexOf('.about-section .welcome-badge-text {'));
    assert.match(pill.slice(0, 400), /font-size: clamp\(0\.7rem, 1\.4vw, 0\.85rem\);/);
    // The shared heading scale is unchanged: only the About override moved.
    const global = globalSteps(read('src/styles/SectionHeading.css'));
    assert.deepEqual(global, [2.5, 3, 3.5, 4.25, 4.75]);
});

console.log(`\n${passed} hero typography checks passed.`);

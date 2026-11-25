/**
 * Phase 43 — the About hero name tag and the welcome wordmark were too small.
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
    // It used to inherit 2.5rem at the base breakpoint and 4.25rem above 1280.
    assert.ok(sizes[0] > 2.5, `${sizes[0]}rem is not larger than the old 2.5rem`);
    assert.ok(sizes[4] > 4.25, `${sizes[4]}rem is not larger than the old 4.25rem`);
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

    // Narrow phones: was clamp(1.2rem, 6.2vw, 1.6rem).
    const narrow = css.slice(css.indexOf('@media (max-width: 420px)'));
    const phone = narrow.match(/--welcome-size: clamp\(([\d.]+)rem, ([\d.]+)vw, ([\d.]+)rem\)/);
    assert.ok(phone, 'the narrow-phone clamp is missing');
    assert.ok(rem(phone[1]) > 1.2, `phone floor ${phone[1]}rem did not grow`);
    assert.ok(rem(phone[3]) > 1.6, `phone ceiling ${phone[3]}rem did not grow`);
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

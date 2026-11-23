/**
 * Phase 39 — regenerate the PWA and browser icon set.
 *
 * The old set was a full-bleed circle: on Android the maskable shape crops the
 * outer ~20%, which clipped the "EF" mark, and `apple-touch-icon.png` did not
 * exist at all even though `index.html` referenced it.
 *
 * This script draws the "EF" monogram from geometry (no font dependency, so it
 * renders identically anywhere), composites a real gradient through a rounded
 * mask, and emits:
 *
 *   public/icons/icon-192x192.png            any-purpose
 *   public/icons/icon-512x512.png            any-purpose
 *   public/icons/icon-maskable-512x512.png   safe zone: art inside the inner 80%
 *   public/icons/icon-monochrome-512x512.png single-colour badge, transparent
 *   public/apple-touch-icon.png              180x180, opaque (iOS)
 *   public/favicon-32x32.png                 browser tab
 *   public/favicon-16x16.png                 browser tab
 *   public/favicon.svg                       scalable favicon
 *   public/favicon.ico                       16 + 32 + 48
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires ImageMagick `convert` on PATH.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = fs.mkdtempSync('/tmp/ef-icons-');

const BRAND_TOP = '#7c3aed';
const BRAND_BOTTOM = '#2563eb';
const DEEP = '#0f172a';

const convert = (args) => execFileSync('convert', args, { stdio: 'pipe' });

/**
 * The monogram, expressed on a 0-100 grid inside its tile.
 * Filled rectangles rather than strokes: predictable weight at 16px.
 */
const E_GLYPHS = [
    [26, 30, 33, 70],
    [26, 30, 51, 37],
    [26, 46.5, 47, 53.5],
    [26, 63, 51, 70]
];

/**
 * 16px cannot resolve letterforms: the strokes land under a pixel and
 * anti-alias into a blob. At tab size a single solid diagonal mark is what
 * actually reads, so the tiniest icons use that instead of a broken "EF".
 */
const MARK_TINY = [
    [26, 26, 58, 42],
    [42, 42, 74, 58],
    [26, 58, 58, 74]
];

const scaleMark = (rectsIn, factor) =>
    rectsIn.map(([x1, y1, x2, y2]) => {
        const cx = 50;
        const cy = 50;
        const sx = v => cx + (v - cx) * factor;
        return [sx(x1), sx(y1), sx(x2), sx(y2)];
    });

const GLYPHS = [
    ...E_GLYPHS,
    // F — spine, then two bars
    [57, 30, 64, 70],
    [57, 30, 82, 37],
    [57, 46.5, 78, 53.5]
];

function rects({ size, scale, glyphs = GLYPHS }) {
    const tile = size * scale;
    const origin = (size - tile) / 2;
    const u = tile / 100;
    return glyphs.map(([x1, y1, x2, y2]) => {
        const w = (x2 - x1) * u;
        const h = (y2 - y1) * u;
        return `rectangle ${Math.round(origin + x1 * u)},${Math.round(origin + y1 * u)} ${Math.round(origin + x1 * u + w)},${Math.round(origin + y1 * u + h)}`;
    });
}

/** Rounded gradient tile with the white monogram, on the deep background. */
function brandIcon({ size, scale, out, tileOnly = false, glyphs = GLYPHS, cornerRatio = 0.22 }) {
    const tile = Math.round(size * scale);
    const origin = Math.round((size - tile) / 2);
    const radius = Math.round(tile * cornerRatio);
    const target = path.join(root, out);

    const gradFile = path.join(tmpDir, `grad-${size}.png`);
    const maskFile = path.join(tmpDir, `mask-${size}.png`);
    const tileFile = path.join(tmpDir, `tile-${size}.png`);

    // 1. brand gradient
    convert(['-size', `${tile}x${tile}`, `gradient:${BRAND_TOP}-${BRAND_BOTTOM}`, gradFile]);
    // 2. rounded-rect alpha mask
    convert([
        '-size', `${tile}x${tile}`, 'xc:none', '-fill', 'white',
        '-draw', `roundrectangle 0,0 ${tile - 1},${tile - 1} ${radius},${radius}`, maskFile
    ]);
    // 3. gradient clipped to the rounded shape
    convert([gradFile, maskFile, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', tileFile]);
    // 4. white monogram drawn straight onto the tile
    convert([
        tileFile, '-fill', 'white',
        ...rects({ size: tile, scale: 1, glyphs }).flatMap(r => ['-draw', r]),
        tileFile
    ]);

    if (tileOnly) {
        fs.copyFileSync(tileFile, target);
    } else {
        convert([
            '-size', `${size}x${size}`, `xc:${DEEP}`,
            tileFile, '-geometry', `+${origin}+${origin}`, '-composite', target
        ]);
    }
    console.log(`  ${out}  ${size}x${size}  ${fs.statSync(target).size} B`);
}

/** Single-colour badge on a transparent canvas. */
function monoIcon({ size, scale, out }) {
    const args = ['-size', `${size}x${size}`, 'xc:none', '-fill', 'white'];
    for (const r of rects({ size, scale })) args.push('-draw', r);
    args.push(path.join(root, out));
    convert(args);
    console.log(`  ${out}  ${size}x${size}  ${fs.statSync(path.join(root, out)).size} B`);
}

fs.mkdirSync(path.join(root, 'public', 'icons'), { recursive: true });

console.log('Generating PWA + browser icons');
brandIcon({ size: 512, scale: 0.86, out: 'public/icons/icon-512x512.png' });
brandIcon({ size: 192, scale: 0.86, out: 'public/icons/icon-192x192.png' });
// Maskable: art confined to the inner safe circle so no launcher shape clips it.
brandIcon({ size: 512, scale: 0.60, out: 'public/icons/icon-maskable-512x512.png' });
monoIcon({ size: 512, scale: 0.70, out: 'public/icons/icon-monochrome-512x512.png' });
// iOS ignores transparency and applies its own rounding.
brandIcon({ size: 180, scale: 0.84, out: 'public/apple-touch-icon.png' });
brandIcon({ size: 32, scale: 0.96, out: 'public/favicon-32x32.png' });
// At 16px two letters collapse into mush: a single, heavier E stays legible.
brandIcon({ size: 16, scale: 1.0, out: 'public/favicon-16x16.png', glyphs: scaleMark(MARK_TINY, 1.35), cornerRatio: 0.10 });

// Scalable favicon mirrors the brand tile.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="ef-bg" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="${BRAND_TOP}"/>
      <stop offset="1" stop-color="${BRAND_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="${DEEP}"/>
  <rect x="13" y="13" width="154" height="154" rx="34" fill="url(#ef-bg)"/>
  <g fill="#ffffff">
    <rect x="53" y="59" width="11" height="62"/>
    <rect x="53" y="59" width="39" height="11"/>
    <rect x="53" y="85" width="33" height="11"/>
    <rect x="53" y="110" width="39" height="11"/>
    <rect x="101" y="59" width="11" height="62"/>
    <rect x="101" y="59" width="39" height="11"/>
    <rect x="101" y="85" width="33" height="11"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(root, 'public/favicon.svg'), svg);
console.log('  public/favicon.svg  180x180  scalable');

// Multi-resolution .ico for legacy browsers.
const icoParts = [16, 32, 48].map((size) => {
    const file = path.join(tmpDir, `ico-${size}.png`);
    brandIcon({
        size,
        scale: size > 20 ? 0.96 : 1.0,
        out: path.relative(root, file),
        glyphs: size > 20 ? GLYPHS : scaleMark(MARK_TINY, 1.35),
        cornerRatio: size > 20 ? 0.22 : 0.10
    });
    return file;
});
convert([...icoParts, path.join(root, 'public/favicon.ico')]);
console.log(`  public/favicon.ico  16+32+48  ${fs.statSync(path.join(root, 'public/favicon.ico')).size} B`);

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('Done.');

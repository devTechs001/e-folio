#!/usr/bin/env node
/**
 * Build the bundled offline snapshot used by public pages when the live API
 * cannot supply a section.
 *
 *   node scripts/build-public-snapshot.mjs
 *
 * Every value is read from LOCAL files that already exist in this repository
 * (backup / seed / sample data). Nothing is invented, fetched or sent out.
 * Live API data always takes precedence in the UI; this file is only a saved
 * copy so the public site stays consistent when the backend is unavailable.
 *
 * Confidential: local checkout only, no credentials, no network.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(read(rel));

/** Extract a JS array literal following `name`, balanced across strings. */
function extractArray(source, name) {
    const at = source.indexOf(name);
    if (at < 0) throw new Error(`Could not find ${name}`);
    const start = source.indexOf('[', at);
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = start; i < source.length; i += 1) {
        const char = source[i];
        if (quote) {
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
        if (char === '[') depth += 1;
        else if (char === ']') {
            depth -= 1;
            if (depth === 0) {
                return vm.runInNewContext(`(${source.slice(start, i + 1)})`, { Date });
            }
        }
    }
    throw new Error(`Unbalanced array for ${name}`);
}

const slug = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 1. Projects — the repository's own published project seed records.
const seedProjects = extractArray(read('scripts/seed-projects.js'), 'const projects');
const projects = seedProjects.map((project, index) => ({
    id: `snapshot-${slug(project.title)}`,
    title: project.title,
    description: project.description,
    fullDescription: project.fullDescription,
    technologies: project.technologies || [],
    category: project.category,
    status: project.status,
    featured: Boolean(project.featured),
    tags: project.tags || [],
    links: project.links || {},
    images: project.images || [],
    thumbnail: project.images?.[0]?.url || '',
    imageUrl: project.images?.[0]?.url || '',
    completionDate: project.completionDate || null,
    teamSize: project.teamSize ?? 1,
    views: 0,
    // Owner-specified display values from the published seed file (see the
    // comment in scripts/seed-projects.js). Not measured engagement.
    likes: Number(project.likes) || 0,
    order: index + 1
}));

// 2. Skills — verbatim from the local seed file.
const skills = extractArray(read('server/seed-data.js'), 'const seedSkills')
    .map((skill, index) => ({ ...skill, id: `snapshot-skill-${index + 1}` }));

// 3. Interests — verbatim values, presented in the shape the public UI uses.
// `level` is a word in the seed data; the UI draws a percentage bar, so it is
// converted with a fixed, documented presentation scale (not a new claim).
const LEVEL_PERCENT = { expert: 90, advanced: 75, intermediate: 60, beginner: 40 };
const interests = extractArray(read('server/seed-data.js'), 'const seedInterests')
    .map((interest, index) => ({
        id: `snapshot-interest-${index + 1}`,
        title: interest.name,
        name: interest.name,
        category: interest.category,
        level: LEVEL_PERCENT[interest.level] ?? 0,
        levelLabel: interest.level,
        description: interest.description,
        icon: interest.icon,
        color: interest.color,
        tags: [],
        relatedTech: []
    }));

// 4. Education — the published fallback records from the public Education page.
const education = extractArray(read('src/pages/Education.jsx'), 'getFallbackEducation');

// 5. Testimonials — the original verbatim client records kept in the local backup.
const testimonials = readJson('server/backups/testimonials/original-fallback-testimonials.json')
    .map((item, index) => ({ ...item, id: `snapshot-testimonial-${index + 1}` }));

// 6. Lab experiments — the repository's own labelled sample records. The
// "[SAMPLE]" marker is presentation-only and removed for the public snapshot.
const labSamples = readJson('src/data/labSamples.json').samples;
const labProjects = labSamples.map((sample, index) => ({
    id: `snapshot-lab-${index + 1}`,
    title: sample.title.replace(/^\[SAMPLE\]\s*/, ''),
    description: sample.description.replace(/^Sample lab experiment:\s*/, ''),
    status: sample.status,
    category: sample.category,
    technologies: sample.technologies || [],
    tags: sample.tags || [],
    links: sample.links || {},
    thumbnail: '',
    imageUrl: '',
    views: 0,
    likes: 0,
    updatedAt: null
}));

const snapshot = {
    generatedAt: new Date().toISOString().slice(0, 10),
    description: 'Saved copy of local backup/seed records. Used by public pages only when the live API cannot supply a section. Live data always wins.',
    sources: [
        'scripts/seed-projects.js',
        'server/seed-data.js',
        'src/pages/Education.jsx',
        'server/backups/testimonials/original-fallback-testimonials.json',
        'src/data/labSamples.json'
    ],
    sections: {
        projects: { success: true, projects, count: projects.length },
        skills: { success: true, skills, count: skills.length },
        interests: { success: true, interests, data: interests, count: interests.length },
        education: { success: true, education, count: education.length },
        testimonials: { success: true, testimonials, count: testimonials.length },
        labProjects: { success: true, projects: labProjects, count: labProjects.length }
    }
};

const out = path.join(root, 'src/data/publicSnapshot.json');
fs.writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, out)}:`);
for (const [name, value] of Object.entries(snapshot.sections)) {
    console.log(`  ${name}: ${value.count} records`);
}

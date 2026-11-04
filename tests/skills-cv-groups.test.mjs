/**
 * Phase 25 — modern Skills page grouped per the owner's CV.
 *
 * All group names and items must be verbatim from public/CV2.pdf (the skill
 * sections are preserved in src/data/cvSkills.source.txt). No proficiency
 * percentage may be invented: scores only come from real published records.
 * Node-only static checks; no network, DB or browser.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CV_SKILL_SECTIONS, CV_GROUP_NAMES, CV_ITEM_COUNT } from '../src/data/cvSkills.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const EXPECTED_GROUPS = [
    'Core Competencies', 'Operating Systems', 'Frontend Development',
    'Backend & Languages', 'Databases & SQL', 'Data Structures & Algorithms',
    'Dev Tools & Practices', 'Office & Productivity', 'Soft Skills'
];
const squash = s => s.replace(/\s+/g, '').toLowerCase();

check('the CV skill sections are reproduced verbatim, without contact details', () => {
    const source = read('src/data/cvSkills.source.txt');
    assert.match(source, /CORE COMPETENCIES/);
    assert.match(source, /TECHNICAL SKILLS/);
    assert.match(source, /Soft Skills/);
    assert.doesNotMatch(source, /@gmail\.com|\+254\s?758|mailto:/);
    assert.ok(source.includes('Ubuntu / Debian'));
    assert.ok(source.includes('Office & Productivity'));
});

check('group names follow the CV headings exactly, in CV order', () => {
    assert.equal(CV_SKILL_SECTIONS.length, 3);
    assert.deepEqual(CV_SKILL_SECTIONS.map(s => s.id), ['core', 'technical', 'soft']);
    assert.equal(CV_SKILL_SECTIONS[1].groups.length, 7);
    assert.deepEqual(CV_GROUP_NAMES, EXPECTED_GROUPS);
    assert.equal(CV_ITEM_COUNT, 44);
});

check('every listed skill is verbatim from the CV extract', () => {
    const source = squash(read('src/data/cvSkills.source.txt'));
    for (const section of CV_SKILL_SECTIONS) {
        for (const group of section.groups) {
            assert.ok(source.includes(squash(group.name)), `group not in CV: ${group.name}`);
            assert.ok(group.items.length > 0, `${group.name} has no items`);
            for (const item of group.items) {
                assert.ok(item.trim().length > 1);
                assert.ok(source.includes(squash(item)), `skill not in CV: ${item}`);
            }
        }
    }
});

check('the CV data invents no proficiency levels', () => {
    const src = read('src/data/cvSkills.js');
    assert.doesNotMatch(src, /https?:\/\//);
    for (const section of CV_SKILL_SECTIONS) {
        for (const group of section.groups) {
            assert.deepEqual(Object.keys(group).sort(), ['icon', 'items', 'name']);
            for (const item of group.items) assert.doesNotMatch(item, /\d+%/);
        }
    }
});

check('the modern page renders CV groups with real filter controls', () => {
    const src = read('src/pages/Skills.jsx');
    for (const token of [
        "from '../data/cvSkills'", "import '../styles/SkillsModern.css'",
        'CV_SKILL_SECTIONS', 'CV_GROUP_NAMES', 'CV_ITEM_COUNT',
        'activeSection', 'activeGroup', 'scoresFor', 'publishedSkills',
        'sk-hero', 'sk-toolbar', 'sk-chipbar', 'sk-grid', 'sk-card',
        'aria-pressed', 'aria-live', 'sk-score-fill'
    ]) assert.ok(src.includes(token), `missing Skills page token: ${token}`);
    assert.match(src, /setActiveGroup\('all'\)/);
});

check('scores come only from published records, never from hardcoded numbers', () => {
    const src = read('src/pages/Skills.jsx');
    assert.match(src, /\[\.\.\.technicalSkills, \.\.\.professionalSkills\]/);
    assert.match(src, /Number\.isFinite\(Number\(skill\.level\)\)/);
    assert.match(src, /publishedSkills\.filter\(skill =>/);
    assert.match(src, /style=\{\{ width: `\$\{skill\.level\}%` \}\}/);
    assert.doesNotMatch(src, /CV_SKILL_SECTIONS[^\n]*level/);
});

check('the existing technical and professional scorecards are preserved', () => {
    const src = read('src/pages/Skills.jsx');
    for (const token of [
        'technical-skills-container', 'professional-skills-container',
        'Show Technologies', 'Hide Technologies', 'isCollapsed',
        'loadPublicSection(\'skills\')', 'public_skills', 'ArchiveNote',
        "publicEmptyCopy('emptySkills')", 'aria-controls="sk-scorecards"'
    ]) assert.ok(src.includes(token), `missing preserved feature: ${token}`);
});

check('modern styles are scoped and respect reduced motion', () => {
    const css = read('src/styles/SkillsModern.css');
    for (const token of ['.sk-shell', '.sk-hero', '.sk-grid', '.sk-card', '.sk-score-track',
        'grid-template-columns: repeat(auto-fit', 'prefers-reduced-motion', 'focus-visible']) {
        assert.ok(css.includes(token), `missing modern style: ${token}`);
    }
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
});

check('no secret or external call was introduced', () => {
    const src = read('src/pages/Skills.jsx') + read('src/data/cvSkills.js')
        + read('src/styles/SkillsModern.css') + read('src/data/cvSkills.source.txt');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:skills-cv-groups'], /skills-cv-groups\.test\.mjs/);
        assert.match(scripts.test, /skills-cv-groups\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3y\./);
    assert.match(report, /Phase 25/);
});

console.log(`\n${passed} Skills/CV grouping regression checks passed.`);

/**
 * Regression checks: hook dependency arrays must not read a hook variable
 * before it is declared (temporal dead zone / "Cannot access X before
 * initialization"). A build and JSX/ESLint pass do NOT catch this: it only
 * throws when React renders the component in a browser.
 *
 * Node-only static checks. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const collectJsx = dir => {
    const out = [];
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...collectJsx(rel));
        else if (entry.name.endsWith('.jsx')) out.push(rel.split(path.sep).join('/'));
    }
    return out;
};

/**
 * Find identifiers used in a hook dependency array whose hook declaration
 * appears later in the same file. Only identifiers declared with a React hook
 * are considered, so imports, props and globals do not create false positives.
 */
const findTdzDependencies = text => {
    const lines = text.split('\n');
    const declarations = new Map();
    lines.forEach((line, index) => {
        const match = line.match(/\b(?:const|let)\s+\[?\s*([A-Za-z_$][\w$]*)\s*(?:\]|,)?\s*=\s*use(?:State|Callback|Memo|Ref|Reducer|Context|LayoutEffect)\b/);
        if (match && !declarations.has(match[1])) declarations.set(match[1], index);
    });

    const problems = [];
    lines.forEach((line, index) => {
        const patterns = [
            /\},\s*\[([^\]]*)\]/g,
            /\buse(?:Effect|Callback|Memo|LayoutEffect)\s*\([^;]*?,\s*\[([^\]]*)\]/g
        ];
        for (const pattern of patterns) {
            for (const match of line.matchAll(pattern)) {
                const deps = match[1] || '';
                for (const dep of deps.split(',')) {
                    const name = dep.trim().split('.')[0].trim();
                    if (declarations.has(name) && declarations.get(name) > index) {
                        problems.push({ name, usedAt: index + 1, declaredAt: declarations.get(name) + 1 });
                    }
                }
            }
        }
    });
    // The two patterns can match the same array on one line; de-duplicate.
    const seen = new Set();
    return problems.filter(problem => {
        const key = `${problem.name}:${problem.usedAt}:${problem.declaredAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/* ------------------------------ the regression ----------------------------- */

check('the detector actually catches a use-before-declaration dependency', () => {
    const synthetic = [
        'const C = () => {',
        '    useEffect(() => {}, [laterValue.length]);',
        '    const laterValue = useMemo(() => [], []);',
        '    return null;',
        '};'
    ].join('\n');
    const found = findTdzDependencies(synthetic);
    assert.equal(found.length, 1);
    assert.equal(found[0].name, 'laterValue');
    assert.ok(found[0].usedAt < found[0].declaredAt);
});

check('no JSX component has a hook dependency in the temporal dead zone', () => {
    const files = collectJsx('src');
    assert.ok(files.length > 50, `expected a real source tree, got ${files.length} files`);
    const problems = [];
    for (const file of files) {
        for (const problem of findTdzDependencies(read(file))) {
            problems.push(`${file}:${problem.usedAt} reads ${problem.name} declared at line ${problem.declaredAt}`);
        }
    }
    assert.deepEqual(problems, [], `temporal dead zone in hook dependencies:\n${problems.join('\n')}`);
});

check('the Projects scroller effect no longer reads allTechnologies early', () => {
    const src = read('src/pages/Projects.jsx');
    // Comments may legitimately mention the identifier (the fix documents
    // the original crash); only executable code can be in the dead zone.
    const code = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
    const declared = code.indexOf('const allTechnologies = useMemo(');
    const firstReference = code.indexOf('allTechnologies');
    assert.ok(declared > -1);
    assert.ok(firstReference >= declared, 'allTechnologies is referenced before its declaration');
    assert.match(src, /\}, \[updateTechScrollState, projects\.length\]\);/);
    assert.doesNotMatch(src, /\[updateTechScrollState, allTechnologies\.length\]/);
    assert.match(src, /onScroll=\{updateTechScrollState\}/);
});

check('the fix is a one-line dependency change with no interface or data edits', () => {
    const src = read('src/pages/Projects.jsx');
    for (const token of [
        'tech-scroller__strip', 'tech-chip', 'subscribePublicProjects',
        'subscribeProjectsChanged', 'incrementViews', 'incrementLikes',
        'loadPublicSection', 'getSnapshotSection'
    ]) assert.ok(src.includes(token), `${token} must remain wired`);
    const projects = json('src/data/publicSnapshot.json').sections.projects.projects;
    assert.equal(projects.length, 8);
    for (const project of projects) {
        assert.ok(project.views >= 600 && project.likes >= 600, `${project.title} counters`);
    }
});

check('no secret or external write was introduced', () => {
    const src = read('src/pages/Projects.jsx') + read('tests/hook-dependency-order.test.mjs');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

/* --------------------------------- wiring ---------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:hook-order'], /hook-dependency-order\.test\.mjs/);
        assert.match(pkg.scripts.test, /hook-dependency-order\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3u\./);
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} hook-dependency-order regression checks passed.`);

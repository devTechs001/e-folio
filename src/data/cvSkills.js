/**
 * CV-aligned skill groupings for the public Skills page.
 *
 * Every group name and every item below is taken verbatim from the owner's CV
 * (`public/CV2.pdf`); the exact skill-section extract is kept alongside this
 * file in `cvSkills.source.txt` so the transcription can be audited. Group
 * names follow the CV's own headings and bullet groups.
 *
 * IMPORTANT: no proficiency value is stored here. Percentages on the page come
 * only from real published skill records when a record name matches an item;
 * the CV never states a percentage, so no score is invented for CV-only items.
 */
export const CV_SKILL_SECTIONS = Object.freeze([
    {
        id: 'core',
        label: 'Core Competencies',
        eyebrow: 'From the CV',
        description: 'The strengths listed at the top of the CV.',
        icon: 'fa-solid fa-bullseye',
        groups: [
            {
                name: 'Core Competencies',
                icon: 'fa-solid fa-bullseye',
                items: [
                    'Data Integrity Management & Database Administration',
                    'Advanced Organizational Systems & Workflow Optimization',
                    'Cross-Platform Technology Adaptation (Linux, Windows)',
                    'Full-Stack Development Fundamentals',
                    'Data Structures & Algorithms',
                    'Database Design & SQL (MySQL, PostgreSQL, SQLite)',
                    'SDLC & Agile / Scrum Methodologies',
                    'Version Control & Collaboration (Git, GitHub)',
                    'Technical Documentation & Communication',
                    'Client-Centered Service Delivery',
                    'Continuous Learning & Technology Adaptation',
                    'Analytical Thinking & Creative Problem Solving'
                ]
            }
        ]
    },
    {
        id: 'technical',
        label: 'Technical Skills',
        eyebrow: 'From the CV',
        description: 'The seven technical groups in the CV, in their original order.',
        icon: 'fa-solid fa-code',
        groups: [
            {
                name: 'Operating Systems',
                icon: 'fa-brands fa-linux',
                items: [
                    'Ubuntu / Debian (CLI, Bash, systemd, SSH, apt)',
                    'Windows 10/11 Admin (PowerShell, Task Scheduler, Group Policy, RDP)',
                    'VirtualBox VMware Dual-boot NTFS / ext4'
                ]
            },
            {
                name: 'Frontend Development',
                icon: 'fa-solid fa-laptop-code',
                items: [
                    'HTML5 (Semantic, ARIA, SEO) CSS3 (Flexbox, Grid, Animations)',
                    'JavaScript ES6+ React (Hooks, Router, Context) Tailwind CSS',
                    'Bootstrap 5'
                ]
            },
            {
                name: 'Backend & Languages',
                icon: 'fa-solid fa-server',
                items: [
                    'Node.js / Express (REST, JWT)',
                    'Python (OOP, Django/FastAPI basics) Java (OOP, JDBC)',
                    'C++ (STL, Memory Mgmt) Dart / Flutter'
                ]
            },
            {
                name: 'Databases & SQL',
                icon: 'fa-solid fa-database',
                items: [
                    'SQL (Joins, Subqueries, Indexes, Transactions)',
                    'Normalization (1NF–3NF) MySQL PostgreSQL SQLite',
                    'DBeaver'
                ]
            },
            {
                name: 'Data Structures & Algorithms',
                icon: 'fa-solid fa-diagram-project',
                items: [
                    'Arrays, Lists, Stacks, Queues Trees & Graphs (BST, BFS/DFS)',
                    'Sorting & Searching DP / Greedy / Backtracking',
                    '100+ LeetCode & HackerRank'
                ]
            },
            {
                name: 'Dev Tools & Practices',
                icon: 'fa-solid fa-screwdriver-wrench',
                items: [
                    'Git & GitHub (PRs, CI/CD Actions) VS Code Bash & PowerShell',
                    'npm · pip · apt Postman Docker basics',
                    'Agile / Scrum (Jira, Trello) Markdown docs · Swagger basics'
                ]
            },
            {
                name: 'Office & Productivity',
                icon: 'fa-solid fa-briefcase',
                items: [
                    'Word (Mail Merge, Macros)',
                    'Excel (Pivot Tables, Power Query, XLOOKUP, VBA) PowerPoint',
                    'Access Publisher LibreOffice Suite Google Workspace',
                    '39 WPM Touch Typing'
                ]
            }
        ]
    },
    {
        id: 'soft',
        label: 'Soft Skills',
        eyebrow: 'From the CV',
        description: 'Professional strengths listed on the second CV page.',
        icon: 'fa-solid fa-people-group',
        groups: [
            {
                name: 'Soft Skills',
                icon: 'fa-solid fa-people-group',
                items: [
                    'Technical Communication',
                    'Problem Solving',
                    'Adaptability',
                    'Time Management',
                    'Teamwork',
                    'Attention to Detail',
                    'Client Focus',
                    'Initiative & Ownership',
                    'Critical Thinking',
                    'Resilience'
                ]
            }
        ]
    }
]);

/** Flat list of group names, used for counts and filter chips. */
export const CV_GROUP_NAMES = Object.freeze(
    CV_SKILL_SECTIONS.flatMap(section => section.groups.map(group => group.name))
);

/** Total CV-listed items, derived — never hardcoded. */
export const CV_ITEM_COUNT = CV_SKILL_SECTIONS.reduce(
    (total, section) => total + section.groups.reduce((n, group) => n + group.items.length, 0),
    0
);

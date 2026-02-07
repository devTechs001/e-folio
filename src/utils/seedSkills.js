// src/utils/seedSkills.js
// Script to seed the database with initial skills

const seedSkills = async () => {
    const skillsData = {
        technical: [
            {
                name: "HTML5",
                level: 95,
                category: "Frontend",
                color: "#e34c26",
                icon: "fa-brands fa-html5",
                type: "technical",
                yearsOfExperience: 5,
                visible: true,
                featured: true
            },
            {
                name: "CSS3",
                level: 90,
                category: "Frontend",
                color: "#264de4",
                icon: "fa-brands fa-css3-alt",
                type: "technical",
                yearsOfExperience: 5,
                visible: true,
                featured: true
            },
            {
                name: "JavaScript",
                level: 85,
                category: "Frontend",
                color: "#f7df1e",
                icon: "fa-brands fa-js",
                type: "technical",
                yearsOfExperience: 6,
                visible: true,
                featured: true
            },
            {
                name: "React",
                level: 88,
                category: "Frontend",
                color: "#61dafb",
                icon: "fa-brands fa-react",
                type: "technical",
                yearsOfExperience: 4,
                visible: true,
                featured: true
            },
            {
                name: "Node.js",
                level: 82,
                category: "Backend",
                color: "#68a063",
                icon: "fa-brands fa-node-js",
                type: "technical",
                yearsOfExperience: 4,
                visible: true,
                featured: true
            },
            {
                name: "Python",
                level: 80,
                category: "Backend",
                color: "#3776ab",
                icon: "fa-brands fa-python",
                type: "technical",
                yearsOfExperience: 5,
                visible: true,
                featured: false
            },
            {
                name: "TypeScript",
                level: 75,
                category: "Frontend",
                color: "#3178c6",
                icon: "fa-brands fa-js",
                type: "technical",
                yearsOfExperience: 3,
                visible: true,
                featured: false
            },
            {
                name: "MongoDB",
                level: 70,
                category: "Database",
                color: "#4db33d",
                icon: "fa-solid fa-database",
                type: "technical",
                yearsOfExperience: 3,
                visible: true,
                featured: false
            },
            {
                name: "PostgreSQL",
                level: 72,
                category: "Database",
                color: "#336791",
                icon: "fa-solid fa-database",
                type: "technical",
                yearsOfExperience: 3,
                visible: true,
                featured: false
            },
            {
                name: "Docker",
                level: 65,
                category: "DevOps",
                color: "#2496ed",
                icon: "fa-brands fa-docker",
                type: "technical",
                yearsOfExperience: 2,
                visible: true,
                featured: false
            },
            {
                name: "AWS",
                level: 60,
                category: "DevOps",
                color: "#ff9900",
                icon: "fa-brands fa-aws",
                type: "technical",
                yearsOfExperience: 2,
                visible: true,
                featured: false
            },
            {
                name: "Git",
                level: 90,
                category: "DevOps",
                color: "#f05032",
                icon: "fa-brands fa-git-alt",
                type: "technical",
                yearsOfExperience: 5,
                visible: true,
                featured: false
            }
        ],
        professional: [
            {
                name: "Problem Solving",
                level: 95,
                category: "Soft Skills",
                color: "#3b82f6",
                icon: "fa-solid fa-lightbulb",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: true
            },
            {
                name: "Communication",
                level: 90,
                category: "Soft Skills",
                color: "#10b981",
                icon: "fa-solid fa-comments",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: true
            },
            {
                name: "Teamwork",
                level: 92,
                category: "Soft Skills",
                color: "#8b5cf6",
                icon: "fa-solid fa-users",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: true
            },
            {
                name: "Leadership",
                level: 85,
                category: "Soft Skills",
                color: "#f59e0b",
                icon: "fa-solid fa-chess-king",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: false
            },
            {
                name: "Time Management",
                level: 88,
                category: "Soft Skills",
                color: "#ef4444",
                icon: "fa-solid fa-clock",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: false
            },
            {
                name: "Adaptability",
                level: 90,
                category: "Soft Skills",
                color: "#8b5cf6",
                icon: "fa-solid fa-sync",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: false
            },
            {
                name: "Critical Thinking",
                level: 87,
                category: "Soft Skills",
                color: "#06b6d4",
                icon: "fa-solid fa-brain",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: false
            },
            {
                name: "Creativity",
                level: 85,
                category: "Soft Skills",
                color: "#ec4899",
                icon: "fa-solid fa-paintbrush",
                type: "professional",
                yearsOfExperience: 0,
                visible: true,
                featured: false
            }
        ]
    };

    try {
        // Add skills to the database
        for (const skill of skillsData.technical) {
            try {
                const response = await fetch('/api/skills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(skill)
                });
                
                if (!response.ok) {
                    console.error(`Failed to add technical skill: ${skill.name}`, await response.text());
                } else {
                    console.log(`Added technical skill: ${skill.name}`);
                }
            } catch (error) {
                console.error(`Error adding technical skill: ${skill.name}`, error);
            }
        }

        for (const skill of skillsData.professional) {
            try {
                const response = await fetch('/api/skills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(skill)
                });
                
                if (!response.ok) {
                    console.error(`Failed to add professional skill: ${skill.name}`, await response.text());
                } else {
                    console.log(`Added professional skill: ${skill.name}`);
                }
            } catch (error) {
                console.error(`Error adding professional skill: ${skill.name}`, error);
            }
        }

        console.log('Seed skills added successfully!');
    } catch (error) {
        console.error('Error seeding skills:', error);
    }
};

// Function to run the seed only once
const runSeedSkills = async () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin/seeds') {
        await seedSkills();
    }
};

export { seedSkills, runSeedSkills };

// Run automatically if called directly
if (typeof window !== 'undefined' && window.location.pathname.includes('seed-skills')) {
    seedSkills();
}
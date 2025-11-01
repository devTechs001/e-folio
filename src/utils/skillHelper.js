// src/utils/skillHelpers.js
export const calculateSkillProgress = (skills) => {
    if (!skills || skills.length === 0) return 0;
    const total = skills.reduce((acc, skill) => acc + skill.level, 0);
    return Math.round(total / skills.length);
};

export const getSkillsByCategory = (skills) => {
    return skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
    }, {});
};

export const getTopSkills = (skills, limit = 5) => {
    return [...skills]
        .sort((a, b) => b.level - a.level)
        .slice(0, limit);
};

export const exportSkillsToJSON = (skills) => {
    const dataStr = JSON.stringify(skills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    return dataUri;
};

export const exportSkillsToCSV = (skills) => {
    const headers = ['Name', 'Type', 'Category', 'Level', 'Years of Experience', 'Featured'];
    const rows = skills.map(skill => [
        skill.name,
        skill.type,
        skill.category || '',
        skill.level,
        skill.yearsOfExperience || 0,
        skill.featured ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
};

export const validateSkillData = (skill) => {
    const errors = [];
    
    if (!skill.name || skill.name.trim() === '') {
        errors.push('Skill name is required');
    }
    
    if (skill.level < 0 || skill.level > 100) {
        errors.push('Level must be between 0 and 100');
    }
    
    if (!['technical', 'professional'].includes(skill.type)) {
        errors.push('Invalid skill type');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};
const calculateProfileCompleteness = (user) => {
    const fields = [
        user.name,
        user.email,
        user.username,
        user.bio,
        user.location,
        user.role,
        user.avatar,
        user.website,
        user.socialLinks?.github || user.socialLinks?.linkedin,
        user.phone
    ];
    
    const completed = fields.filter(field => field && field.trim && field.trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
};

const generateProfileSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

const validateSocialLink = (platform, url) => {
    const patterns = {
        github: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
        linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
        twitter: /^https?:\/\/(www\.)?twitter\.com\/[\w]+\/?$/
    };

    if (!url) return true; // Empty is valid
    return patterns[platform] ? patterns[platform].test(url) : true;
};

module.exports = {
    calculateProfileCompleteness,
    generateProfileSlug,
    validateSocialLink
};
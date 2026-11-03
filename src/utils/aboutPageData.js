/**
 * Single source of truth for the public About page's *profile* data.
 *
 * The public About page (src/pages/About.jsx) and the dashboard Profile page
 * (src/components/dashboard/Profile.jsx) both build their view model from this
 * module, so they can never drift. All personal values come from the real
 * `/api/settings` / `/api/profile` payloads (SettingsProvider dispatches them
 * via `settingsChanged`); the constants below are only the site's own copy and
 * the owner's published fallback links, never invented client records.
 */

export const ABOUT_WELCOME = 'WELCOME TO MY PORTFOLIO';
export const ABOUT_AVAILABILITY = 'Available for work';
export const ABOUT_CV_HREF = '/CV2.pdf';

export const ABOUT_ROLES = [
    'Frontend Developer',
    'Web Designer',
    'UI/UX Designer',
    'Software Developer',
    'Full Stack Developer',
    'Creative Problem Solver'
];

export const ABOUT_IMAGES = [
    { src: 'assets/images/profile-pic.jpg', alt: 'Profile' },
    { src: 'assets/images/profile_pic.png', alt: 'Portrait' },
    { src: 'assets/images/programmer.png', alt: 'Developer' }
];

export const ABOUT_BIO_FALLBACK =
    'I am a passionate and creative developer with a strong foundation in web development ' +
    'and software engineering. I specialize in creating responsive and user-friendly web ' +
    'applications using modern technologies and best practices.';

export const ABOUT_SECOND_PARAGRAPH =
    'My approach combines technical excellence with creative problem-solving, ensuring ' +
    'that each project not only functions flawlessly but also provides an exceptional ' +
    'user experience.';

/** Published fallback links (only used when the owner has not set one). */
export const ABOUT_DEFAULT_SOCIAL_URLS = {
    facebook: 'https://www.facebook.com/profile.php?id=100089960419104',
    instagram: 'https://www.instagram.com/king_wisdom_ndk/',
    github: 'https://github.com/devTechs001',
    telegram: 'https://t.me/+254758175275',
    whatsapp: 'https://wa.me/254758175275'
};

export const ABOUT_SOCIAL_PLATFORMS = [
    { key: 'facebook', name: 'Facebook', icon: 'fab fa-facebook-f', color: 'facebook' },
    { key: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: 'instagram' },
    { key: 'github', name: 'GitHub', icon: 'fab fa-github', color: 'github' },
    { key: 'telegram', name: 'Telegram', icon: 'fab fa-telegram-plane', color: 'telegram' },
    { key: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp', color: 'whatsapp' },
    { key: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin-in', color: 'linkedin' },
    { key: 'twitter', name: 'Twitter', icon: 'fab fa-twitter', color: 'twitter' },
    { key: 'website', name: 'Website', icon: 'fas fa-globe', color: 'website' }
];

/**
 * Build the About page's social links from a real settings/profile payload.
 * Accepts both the flat `/api/settings` shape (github, facebook, ...) and the
 * nested `/api/profile` shape (socialLinks: {...}).
 */
export const buildAboutSocialLinks = (profile = {}) => {
    const nested = profile.socialLinks || {};
    const value = key => profile[key] || nested[key] || '';
    return ABOUT_SOCIAL_PLATFORMS.map(platform => ({
        ...platform,
        url: value(platform.key) || ABOUT_DEFAULT_SOCIAL_URLS[platform.key] || ''
    })).filter(link => link.url);
};

/** Normalise the two API shapes into the fields the About page renders. */
export const buildAboutProfile = (settingsProfile, user) => {
    const p = settingsProfile || user || {};
    const nested = p.socialLinks || {};
    return {
        name: p.name || user?.name || '',
        bio: p.bio || '',
        tagline: p.tagline || '',
        role: p.role || '',
        location: p.location || '',
        company: p.company || '',
        website: p.website || nested.website || '',
        avatar: p.avatar || user?.avatar || '',
        yearsOfExperience: p.yearsOfExperience ?? '',
        availability: p.availability || ABOUT_AVAILABILITY,
        socialLinks: buildAboutSocialLinks(p)
    };
};

/** Split the display name the same way the About page heading does. */
export const aboutNameParts = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || 'Dev', second: parts[1] || 'Techs' };
};

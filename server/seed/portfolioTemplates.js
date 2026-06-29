const templates = [
  // === FREE PORTFOLIO TEMPLATES ===
  {
    name: 'Modern Developer',
    slug: 'modern-developer',
    type: 'portfolio',
    description: 'Clean, professional portfolio for developers with a focus on code and projects',
    isPremium: false,
    category: 'developer',
    colorScheme: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#8b5cf6', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', textSecondary: '#94a3b8', border: '#334155' },
    layout: { sections: ['hero', 'about', 'skills', 'projects', 'experience', 'contact'], style: 'modern', maxSections: 15 },
    features: ['Responsive Design', 'Dark Theme', 'Project Showcase', 'Skill Bars'],
    downloads: 1240, rating: 4.5
  },
  {
    name: 'Minimal Portfolio',
    slug: 'minimal-portfolio',
    type: 'portfolio',
    description: 'Minimal, elegant design that puts your work front and center',
    isPremium: false,
    category: 'minimal',
    colorScheme: { primary: '#f8fafc', secondary: '#e2e8f0', accent: '#6366f1', background: '#ffffff', surface: '#f1f5f9', text: '#0f172a', textSecondary: '#64748b', border: '#e2e8f0' },
    layout: { sections: ['hero', 'projects', 'about', 'contact'], style: 'minimal', maxSections: 10 },
    features: ['Light Theme', 'Minimal Design', 'Fast Loading', 'Clean Typography'],
    downloads: 980, rating: 4.3
  },
  {
    name: 'Creative Designer',
    slug: 'creative-designer',
    type: 'portfolio',
    description: 'Bold, creative layout for designers and artists to showcase their work',
    isPremium: false,
    category: 'creative',
    colorScheme: { primary: '#ec4899', secondary: '#f97316', accent: '#a855f7', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', textSecondary: '#94a3b8', border: '#334155' },
    layout: { sections: ['hero', 'gallery', 'about', 'services', 'testimonials', 'contact'], style: 'creative', maxSections: 12 },
    features: ['Image Gallery', 'Dark Theme', 'Animated Elements', 'Full-width Sections'],
    downloads: 1560, rating: 4.7
  },

  // === PREMIUM PORTFOLIO TEMPLATES ===
  {
    name: 'Executive PRO',
    slug: 'executive-pro',
    type: 'portfolio',
    description: 'Premium executive-level portfolio with advanced analytics and lead generation',
    isPremium: true,
    category: 'business',
    colorScheme: { primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b', background: '#0b1120', surface: '#1a2332', text: '#ffffff', textSecondary: '#94a3b8', border: '#2a3a4a' },
    layout: { sections: ['hero', 'stats', 'about', 'services', 'projects', 'testimonials', 'pricing', 'faq', 'contact', 'newsletter'], style: 'corporate', maxSections: 30 },
    features: ['Lead Capture Forms', 'Advanced Analytics', 'A/B Testing', 'Priority Support', 'Custom Domain Ready', 'SEO Optimized', 'Multi-language'],
    downloads: 340, rating: 4.9
  },
  {
    name: 'Portfolio MAX',
    slug: 'portfolio-max',
    type: 'portfolio',
    description: 'Feature-packed portfolio with video backgrounds, 3D elements, and interactive timelines',
    isPremium: true,
    category: 'showcase',
    colorScheme: { primary: '#00ff88', secondary: '#06b6d4', accent: '#ff00ff', background: '#000000', surface: '#111111', text: '#ffffff', textSecondary: '#888888', border: '#222222' },
    layout: { sections: ['hero-video', 'about', 'timeline', 'skills', 'projects', 'gallery', 'testimonials', 'blog', 'contact'], style: 'immersive', maxSections: 25 },
    features: ['Video Backgrounds', '3D Elements', 'Interactive Timeline', 'Blog Section', 'Custom Animations', 'Priority Support'],
    downloads: 210, rating: 4.8
  },
  {
    name: 'Agency Elite',
    slug: 'agency-elite',
    type: 'portfolio',
    description: 'Full-featured agency template with team showcase, portfolio, and client management',
    isPremium: true,
    category: 'agency',
    colorScheme: { primary: '#8b5cf6', secondary: '#6366f1', accent: '#06b6d4', background: '#0a0a1a', surface: '#151530', text: '#ffffff', textSecondary: '#a0a0c0', border: '#252550' },
    layout: { sections: ['hero', 'stats', 'services', 'team', 'projects', 'testimonials', 'pricing', 'blog', 'contact', 'clients', 'process'], style: 'modern', maxSections: 35 },
    features: ['Team Management', 'Client Portal', 'Project Manager', 'Invoice System', 'White Label', 'API Access', 'Priority Support'],
    downloads: 180, rating: 5.0
  },

  // === FREE CV TEMPLATES ===
  {
    name: 'Classic CV',
    slug: 'classic-cv',
    type: 'cv',
    description: 'Traditional, professional CV layout suitable for all industries',
    isPremium: false,
    category: 'professional',
    colorScheme: { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', background: '#ffffff', surface: '#f8fafc', text: '#1e293b', textSecondary: '#64748b', border: '#e2e8f0' },
    layout: { sections: ['header', 'summary', 'experience', 'education', 'skills', 'certifications'], style: 'classic', maxSections: 10 },
    features: ['ATS Friendly', 'Print Optimized', 'Single Page', 'PDF Export'],
    downloads: 2100, rating: 4.4
  },
  {
    name: 'Modern CV',
    slug: 'modern-cv',
    type: 'cv',
    description: 'Contemporary CV design with color accents and clean layout',
    isPremium: false,
    category: 'modern',
    colorScheme: { primary: '#06b6d4', secondary: '#0891b2', accent: '#8b5cf6', background: '#f0fdfa', surface: '#ffffff', text: '#0f172a', textSecondary: '#64748b', border: '#cbd5e1' },
    layout: { sections: ['header', 'profile', 'experience', 'education', 'skills', 'languages', 'interests'], style: 'modern', maxSections: 12 },
    features: ['Color Accents', 'Two Column', 'Skill Meter', 'Portfolio Link'],
    downloads: 1850, rating: 4.6
  },

  // === PREMIUM CV TEMPLATES ===
  {
    name: 'Executive CV',
    slug: 'executive-cv',
    type: 'cv',
    description: 'Premium executive CV with achievement metrics and leadership focus',
    isPremium: true,
    category: 'executive',
    colorScheme: { primary: '#1e293b', secondary: '#334155', accent: '#f59e0b', background: '#ffffff', surface: '#f1f5f9', text: '#0f172a', textSecondary: '#475569', border: '#cbd5e1' },
    layout: { sections: ['header', 'executive-summary', 'achievements', 'experience', 'education', 'skills', 'certifications', 'publications', 'references'], style: 'executive', maxSections: 15 },
    features: ['ATS Optimized', 'Achievement Metrics', 'Leadership Focus', 'Publication Section', 'Multi-page', 'Priority Support'],
    downloads: 420, rating: 4.7
  },
  {
    name: 'Creative CV PRO',
    slug: 'creative-cv-pro',
    type: 'cv',
    description: 'Stand out with this visually rich CV template for creative professionals',
    isPremium: true,
    category: 'creative',
    colorScheme: { primary: '#ec4899', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', textSecondary: '#94a3b8', border: '#334155' },
    layout: { sections: ['header', 'profile', 'experience', 'skills', 'portfolio', 'testimonials', 'education', 'interests'], style: 'creative', maxSections: 14 },
    features: ['Dark Theme', 'Portfolio Gallery', 'Video Intro', 'Custom Icons', 'Interactive Elements', 'Priority Support'],
    downloads: 380, rating: 4.8
  }
];

module.exports = templates;

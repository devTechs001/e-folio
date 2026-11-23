const mongoose = require('mongoose');

const cvSectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  content: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const curriculumVitaeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    name: { type: String, default: 'Dev Techs' },
    title: { type: String, default: 'Full Stack Developer & AI Engineer' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  experience: [{
    id: { type: String, required: true },
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    period: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: [String],
    visible: { type: Boolean, default: true }
  }],
  education: [{
    id: { type: String, required: true },
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    period: { type: String, default: '' },
    details: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  skills: {
    type: Map,
    of: [String],
    default: {
      Frontend: ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS'],
      Backend: ['Node.js', 'Express.js', 'Python', 'MongoDB'],
      'AI/ML': ['TensorFlow', 'OpenAI API'],
      Tools: ['Git', 'Docker', 'AWS', 'CI/CD']
    }
  },
  projects: [{
    id: { type: String, required: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: [String],
    technologies: [String],
    url: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  achievements: [{
    id: { type: String, required: true },
    text: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  // Phase 33 — sections that already existed in the editor/export flow are
  // now stored, so the public CV can show a complete document.
  certifications: [{
    id: { type: String, required: true },
    name: { type: String, default: '' },
    issuer: { type: String, default: '' },
    period: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  languages: [{
    id: { type: String, required: true },
    name: { type: String, default: '' },
    level: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  links: [{
    id: { type: String, required: true },
    label: { type: String, default: '' },
    url: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }],
  settings: {
    template: { type: String, default: 'modern' },
    primaryColor: { type: String, default: '#2563eb' },
    fontFamily: { type: String, default: 'Inter, sans-serif' },
    showPhoto: { type: Boolean, default: false },
    showQRCode: { type: Boolean, default: false },
    showContactIcons: { type: Boolean, default: true },
    sectionOrder: [String],
    customCSS: { type: String, default: '' }
  },
  // Lifecycle: a CV can be kept private while it is being written, and every
  // save keeps the last published snapshot for "view as visitor".
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
  lastReviewedAt: { type: Date, default: null },
  publishedSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  versions: [{
    name: String,
    data: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

curriculumVitaeSchema.index({ userId: 1 });

module.exports = mongoose.model('CurriculumVitae', curriculumVitaeSchema);

const CurriculumVitae = require('../models/CurriculumVitae');
const { publishUserNotification } = require('../socket/notifications.handler');

// Phase 33 — every write goes through one sanitiser so a new section can never
// be persisted with the wrong shape (or bypass the visible flag).
const MAX_ENTRIES = 100;
const asText = (value, max = 400) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const asStringList = (value, max = 40) => (Array.isArray(value)
  ? value.map(item => asText(item, 120)).filter(Boolean).slice(0, max)
  : []);
const makeId = index => `item_${Date.now().toString(36)}_${index}`;

const normaliseEntry = (section, item, index) => {
  const source = item && typeof item === 'object' ? item : {};
  const base = {
    id: asText(source.id, 80) || makeId(index),
    visible: source.visible !== false
  };
  switch (section) {
    case 'experience':
      return { ...base, title: asText(source.title, 160), company: asText(source.company, 160), period: asText(source.period, 80), location: asText(source.location, 120), description: asText(source.description, 2000), technologies: asStringList(source.technologies) };
    case 'education':
      return { ...base, degree: asText(source.degree, 160), institution: asText(source.institution, 160), period: asText(source.period, 80), details: asText(source.details, 600) };
    case 'projects':
      return { ...base, name: asText(source.name, 160), description: asText(source.description, 1200), url: asText(source.url, 400), highlights: asStringList(source.highlights), technologies: asStringList(source.technologies) };
    case 'achievements':
      return { ...base, text: asText(source.text, 400) };
    case 'certifications':
      return { ...base, name: asText(source.name, 200), issuer: asText(source.issuer, 160), period: asText(source.period, 80), credentialUrl: asText(source.credentialUrl, 400) };
    case 'languages':
      return { ...base, name: asText(source.name, 80), level: asText(source.level, 40) };
    case 'links':
      return { ...base, label: asText(source.label, 120), url: asText(source.url, 400) };
    default:
      return null;
  }
};

const normaliseSection = (section, value) => {
  if (!Array.isArray(value)) return null;
  return value.slice(0, MAX_ENTRIES)
    .map((item, index) => normaliseEntry(section, item, index))
    .filter(Boolean);
};

const normaliseSkills = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  Object.entries(value).slice(0, 30).forEach(([group, list]) => {
    const name = asText(group, 80);
    if (!name) return;
    const items = asStringList(list, 60);
    if (items.length) out[name] = items;
  });
  return out;
};

const normalisePersonalInfo = value => {
  if (!value || typeof value !== 'object') return null;
  return {
    name: asText(value.name, 120),
    title: asText(value.title, 160),
    email: asText(value.email, 200),
    phone: asText(value.phone, 60),
    location: asText(value.location, 120),
    website: asText(value.website, 400),
    github: asText(value.github, 400),
    linkedin: asText(value.linkedin, 400),
    bio: asText(value.bio, 1200),
    avatar: asText(value.avatar, 600)
  };
};

const normaliseSettings = value => {
  if (!value || typeof value !== 'object') return null;
  return {
    template: asText(value.template, 40) || 'modern',
    primaryColor: asText(value.primaryColor, 20) || '#2563eb',
    fontFamily: asText(value.fontFamily, 120) || 'Inter, sans-serif',
    showPhoto: value.showPhoto === true,
    showQRCode: value.showQRCode === true,
    showContactIcons: value.showContactIcons !== false,
    sectionOrder: asStringList(value.sectionOrder, 12),
    customCSS: asText(value.customCSS, 4000)
  };
};

const snapshotOf = cv => ({
  personalInfo: cv.personalInfo,
  experience: cv.experience,
  education: cv.education,
  skills: cv.skills,
  projects: cv.projects,
  achievements: cv.achievements,
  certifications: cv.certifications,
  languages: cv.languages,
  links: cv.links,
  settings: cv.settings
});

exports.getCV = async (req, res) => {
  try {
    let cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      cv = new CurriculumVitae({ userId: req.user._id });
      await cv.save();
      publishUserNotification(req.user._id, {
        type: 'cv',
        title: 'CV workspace created',
        message: 'Your CV record is ready. Open the CV Editor to add your details.',
        link: '/dashboard/cv-editor',
        metadata: { event: 'cv_created' }
      }).catch(() => {});
    }
    res.json({ success: true, data: cv });
  } catch (err) {
    console.error('Get CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to load CV' });
  }
};

exports.saveCV = async (req, res) => {
  try {
    const body = req.body || {};
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    const personalInfo = normalisePersonalInfo(body.personalInfo);
    if (personalInfo) cv.personalInfo = personalInfo;
    for (const section of ['experience', 'education', 'projects', 'achievements', 'certifications', 'languages', 'links']) {
      const value = normaliseSection(section, body[section]);
      if (value) cv[section] = value;
    }
    const skills = normaliseSkills(body.skills);
    if (skills) cv.skills = skills;
    const settings = normaliseSettings(body.settings);
    if (settings) cv.settings = settings;
    await cv.save();
    publishUserNotification(req.user._id, {
      type: 'cv',
      title: 'CV saved',
      message: 'Your CV changes were saved successfully.',
      link: '/dashboard/cv-editor',
      metadata: { event: 'cv_saved' }
    }).catch(() => {});
    res.json({ success: true, data: cv, message: 'CV saved successfully' });
  } catch (err) {
    console.error('Save CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to save CV' });
  }
};

exports.createVersion = async (req, res) => {
  try {
    const { name } = req.body;
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    const version = {
      name: asText(name, 120) || `Version ${cv.versions.length + 1}`,
      data: snapshotOf(cv),
      createdAt: new Date()
    };
    cv.versions.push(version);
    await cv.save();
    res.json({ success: true, data: cv.versions, message: 'Version created' });
  } catch (err) {
    console.error('Create version error:', err);
    res.status(500).json({ success: false, message: 'Failed to create version' });
  }
};

exports.getVersions = async (req, res) => {
  try {
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data: cv.versions });
  } catch (err) {
    console.error('Get versions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load versions' });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    const version = cv.versions.id(versionId);
    if (!version) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }
    const data = version.data || {};
    const personalInfo = normalisePersonalInfo(data.personalInfo);
    if (personalInfo) cv.personalInfo = personalInfo;
    for (const section of ['experience', 'education', 'projects', 'achievements', 'certifications', 'languages', 'links']) {
      const value = normaliseSection(section, data[section]);
      if (value) cv[section] = value;
    }
    const skills = normaliseSkills(data.skills);
    if (skills) cv.skills = skills;
    const settings = normaliseSettings(data.settings);
    if (settings) cv.settings = settings;
    await cv.save();
    res.json({ success: true, data: cv, message: 'Version restored' });
  } catch (err) {
    console.error('Restore version error:', err);
    res.status(500).json({ success: false, message: 'Failed to restore version' });
  }
};

exports.deleteVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    cv.versions.pull({ _id: versionId });
    await cv.save();
    res.json({ success: true, data: cv.versions, message: 'Version deleted' });
  } catch (err) {
    console.error('Delete version error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete version' });
  }
};

exports.exportCV = async (req, res) => {
  try {
    const { format } = req.params;
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${cv.personalInfo.name.replace(/\s+/g, '_')}_CV.json"`);
      return res.json(cv);
    }
    res.json({ success: true, data: cv });
  } catch (err) {
    console.error('Export CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to export CV' });
  }
};

/**
 * Phase 33 — publish / unpublish a CV.
 *
 * Publishing stores the exact visible document in `publishedSnapshot`, which
 * is what the public page renders. Unpublishing keeps the draft private. A
 * private CV keeps returning 404 on the public route, so nothing leaks early.
 */
exports.publishCV = async (req, res) => {
  try {
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    cv.publishedSnapshot = snapshotOf(cv);
    cv.isPublished = true;
    cv.publishedAt = new Date();
    await cv.save();
    publishUserNotification(req.user._id, {
      type: 'cv',
      title: 'CV published',
      message: 'Your CV link is now visible to visitors.',
      link: '/dashboard/cv-editor',
      metadata: { event: 'cv_published' }
    }).catch(() => {});
    res.json({ success: true, data: cv, message: 'CV published' });
  } catch (err) {
    console.error('Publish CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to publish CV' });
  }
};

exports.unpublishCV = async (req, res) => {
  try {
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    cv.isPublished = false;
    await cv.save();
    res.json({ success: true, data: cv, message: 'CV unpublished' });
  } catch (err) {
    console.error('Unpublish CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to unpublish CV' });
  }
};

exports.reviewCV = async (req, res) => {
  try {
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    cv.lastReviewedAt = new Date();
    await cv.save();
    res.json({ success: true, data: snapshotOf(cv), reviewedAt: cv.lastReviewedAt });
  } catch (err) {
    console.error('Review CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to review CV' });
  }
};

/**
 * Import an existing CV export (JSON produced by this editor) into the draft.
 * Only known sections are read; everything else in the file is ignored.
 */
exports.importCV = async (req, res) => {
  try {
    const source = req.body && typeof req.body === 'object' ? (req.body.cv || req.body) : null;
    if (!source) {
      return res.status(400).json({ success: false, message: 'No CV data supplied' });
    }
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    const personalInfo = normalisePersonalInfo(source.personalInfo);
    if (personalInfo) cv.personalInfo = personalInfo;
    let imported = 0;
    for (const section of ['experience', 'education', 'projects', 'achievements', 'certifications', 'languages', 'links']) {
      const value = normaliseSection(section, source[section]);
      if (value) { cv[section] = value; imported += value.length; }
    }
    const skills = normaliseSkills(source.skills);
    if (skills) cv.skills = skills;
    const settings = normaliseSettings(source.settings);
    if (settings) cv.settings = settings;
    await cv.save();
    res.json({
      success: true,
      data: cv,
      message: `CV draft updated from the import (${imported} entries)`
    });
  } catch (err) {
    console.error('Import CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to import CV' });
  }
};

const CurriculumVitae = require('../models/CurriculumVitae');

exports.getCV = async (req, res) => {
  try {
    let cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      cv = new CurriculumVitae({ userId: req.user._id });
      await cv.save();
    }
    res.json({ success: true, data: cv });
  } catch (err) {
    console.error('Get CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to load CV' });
  }
};

exports.saveCV = async (req, res) => {
  try {
    const { personalInfo, experience, education, skills, projects, achievements, settings } = req.body;
    const cv = await CurriculumVitae.findOne({ userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ success: false, message: 'CV not found' });
    }
    if (personalInfo) cv.personalInfo = personalInfo;
    if (experience) cv.experience = experience;
    if (education) cv.education = education;
    if (skills) cv.skills = skills;
    if (projects) cv.projects = projects;
    if (achievements) cv.achievements = achievements;
    if (settings) cv.settings = settings;
    await cv.save();
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
      name: name || `Version ${cv.versions.length + 1}`,
      data: {
        personalInfo: cv.personalInfo,
        experience: cv.experience,
        education: cv.education,
        skills: cv.skills,
        projects: cv.projects,
        achievements: cv.achievements
      },
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
    const data = version.data;
    if (data.personalInfo) cv.personalInfo = data.personalInfo;
    if (data.experience) cv.experience = data.experience;
    if (data.education) cv.education = data.education;
    if (data.skills) cv.skills = data.skills;
    if (data.projects) cv.projects = data.projects;
    if (data.achievements) cv.achievements = data.achievements;
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

const parseService = require('../services/parseService');

/**
 * Handles the incoming request for resume parsing
 */
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No resume file uploaded' } });
    }

    const uploadedResume = await parseService.saveUploadedResume(req.file);

    res.status(201).json({
      message: 'Resume uploaded successfully',
      data: uploadedResume,
    });
  } catch (error) {
    next(error);
  }
};

exports.parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No resume file uploaded' } });
    }

    const parsedResume = await parseService.parseAndSaveResume(req.file);

    res.status(200).json({
      message: 'Resume parsed successfully',
      data: parsedResume.data,
      resume: parsedResume,
    });
  } catch (error) {
    next(error);
  }
};

exports.parseUploadedResume = async (req, res, next) => {
  try {
    const parsedResume = await parseService.parseUploadedResume(req.params.id);

    if (!parsedResume) {
      return res.status(404).json({ error: { message: 'Uploaded resume not found' } });
    }

    res.status(200).json({
      message: 'Resume parsed successfully',
      data: parsedResume,
    });
  } catch (error) {
    next(error);
  }
};

exports.getParsedResumes = async (req, res, next) => {
  try {
    const parsedResumes = await parseService.getAllParsedResumes();

    res.status(200).json({
      message: 'Parsed resumes fetched successfully',
      data: parsedResumes,
    });
  } catch (error) {
    next(error);
  }
};

exports.getParsedResumeById = async (req, res, next) => {
  try {
    const parsedResume = await parseService.getParsedResumeById(req.params.id);

    if (!parsedResume) {
      return res.status(404).json({ error: { message: 'Parsed resume not found' } });
    }

    res.status(200).json({
      message: 'Parsed resume fetched successfully',
      data: parsedResume,
    });
  } catch (error) {
    next(error);
  }
};

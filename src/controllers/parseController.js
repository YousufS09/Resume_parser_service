const parseService = require('../services/parseService');

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const invalidId = (res) => res.status(400).json({ error: { message: 'Resume id must be a positive integer' } });

const parseNonNegativeInt = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

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

const runParse = (force) => async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return invalidId(res);
    }

    const parsedResume = await parseService.parseUploadedResume(id, { force });

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

exports.parseUploadedResume = runParse(false);
exports.reparseResume = runParse(true);

exports.getParsedResumes = async (req, res, next) => {
  try {
    const limit = parseNonNegativeInt(req.query.limit);
    const offset = parseNonNegativeInt(req.query.offset);

    if (limit === null || offset === null) {
      return res.status(400).json({ error: { message: 'limit and offset must be non-negative integers' } });
    }

    const { items, total } = await parseService.getAllParsedResumes({ limit, offset });

    res.status(200).json({
      message: 'Parsed resumes fetched successfully',
      data: items,
      pagination: {
        total,
        limit: limit ?? null,
        offset: offset ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getParsedResumeById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return invalidId(res);
    }

    const parsedResume = await parseService.getParsedResumeById(id);

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

exports.downloadResumeFile = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return invalidId(res);
    }

    const file = await parseService.getResumeFile(id);

    if (!file) {
      return res.status(404).json({ error: { message: 'Resume not found' } });
    }

    if (!file.exists) {
      return res.status(410).json({ error: { message: 'The original file is no longer stored on the server' } });
    }

    res.download(file.path, file.name);
  } catch (error) {
    next(error);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return invalidId(res);
    }

    const deleted = await parseService.deleteResume(id);

    if (!deleted) {
      return res.status(404).json({ error: { message: 'Resume not found' } });
    }

    res.status(200).json({ message: 'Resume deleted successfully', data: { id } });
  } catch (error) {
    next(error);
  }
};

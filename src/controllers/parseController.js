const parseService = require('../services/parseService');
const fs = require('fs');

/**
 * Handles the incoming request for resume parsing
 */
exports.parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No resume file uploaded' } });
    }

    const filePath = req.file.path;
    const fileMimeType = req.file.mimetype;

    // Call the service layer to process the business logic
    const parsedData = await parseService.extractResumeData(filePath, fileMimeType);

    // Optional: Clean up the uploaded file after processing
    // fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Resume parsed successfully',
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};

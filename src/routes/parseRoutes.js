const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { createRateLimiter } = require('../middlewares/rateLimit');
const parseController = require('../controllers/parseController');

// Limits requests that write files or call the LLM (default: 30 per IP per 15 minutes)
const writeLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 30),
});

// POST /api/parse/upload - Uploads a resume file without parsing it
router.post('/upload', writeLimiter, uploadMiddleware.single('resume'), parseController.uploadResume);

// POST /api/parse/resume - Uploads and parses a resume file
router.post('/resume', writeLimiter, uploadMiddleware.single('resume'), parseController.parseResume);

// POST /api/parse/resumes/:id/parse - Parses a previously uploaded resume (returns stored result if already parsed)
router.post('/resumes/:id/parse', writeLimiter, parseController.parseUploadedResume);

// POST /api/parse/resumes/:id/reparse - Parses a stored resume file again, replacing the saved result
router.post('/resumes/:id/reparse', writeLimiter, parseController.reparseResume);

// GET /api/parse/resumes - Lists parsed resumes (optional ?limit=&offset=)
router.get('/resumes', parseController.getParsedResumes);

// GET /api/parse/resumes/:id - Fetches one parsed resume by id
router.get('/resumes/:id', parseController.getParsedResumeById);

// GET /api/parse/resumes/:id/file - Downloads the original uploaded file
router.get('/resumes/:id/file', parseController.downloadResumeFile);

// DELETE /api/parse/resumes/:id - Deletes a resume, its file, and the candidate if no other resume uses it
router.delete('/resumes/:id', parseController.deleteResume);

module.exports = router;

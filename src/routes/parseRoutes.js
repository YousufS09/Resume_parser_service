const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const parseController = require('../controllers/parseController');

// POST /api/parse/upload - Uploads a resume file without parsing it
router.post('/upload', uploadMiddleware.single('resume'), parseController.uploadResume);

// POST /api/parse/resume - Uploads and parses a resume file
router.post('/resume', uploadMiddleware.single('resume'), parseController.parseResume);

// POST /api/parse/resumes/:id/parse - Parses a previously uploaded resume
router.post('/resumes/:id/parse', parseController.parseUploadedResume);

// GET /api/parse/resumes - Lists all parsed resumes
router.get('/resumes', parseController.getParsedResumes);

// GET /api/parse/resumes/:id - Fetches one parsed resume by id
router.get('/resumes/:id', parseController.getParsedResumeById);

module.exports = router;

const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const parseController = require('../controllers/parseController');

// POST /api/parse/resume - Uploads and parses a resume file
router.post('/resume', uploadMiddleware.single('resume'), parseController.parseResume);

module.exports = router;

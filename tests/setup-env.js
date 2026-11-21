// Runs before every test file (see "jest.setupFiles" in package.json).
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';

// Force the rule-based parser so tests are deterministic and never call the Groq API.
// dotenv does not overwrite variables that already exist, so this survives .env loading.
process.env.GROQ_API_KEY = '';

// Keep test uploads out of the real uploads/ folder.
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'resume-parser-test-uploads');

// Load TEST_DB_URL (and anything else) from .env. In test mode the app only connects to TEST_DB_URL.
require('dotenv').config({ quiet: true });

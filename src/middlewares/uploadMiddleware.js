const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (UPLOAD_DIR lets tests and deployments use another location)
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

// Only PDF and DOCX can be parsed (mammoth does not read legacy .doc files).
// Both the MIME type and the extension must match, since the MIME type is client-supplied.
const allowedTypes = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (allowedTypes[extension] && allowedTypes[extension] === file.mimetype) {
    cb(null, true);
    return;
  }

  const error = new Error('Invalid file type. Only PDF and DOCX files are allowed.');
  error.status = 400;
  cb(error, false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

module.exports = upload;
module.exports.uploadDir = uploadDir;
module.exports.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

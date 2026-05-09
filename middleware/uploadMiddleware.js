// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Default upload directory
const DEFAULT_UPLOAD_DIR = 'uploads/images';

// Ensure the directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create storage engine with configurable destination
const createStorage = (destination) => {
  ensureDirectoryExists(destination);
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

// Default upload middleware (uses 'uploads/images')
const upload = multer({
  storage: createStorage(DEFAULT_UPLOAD_DIR),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Optionally, export a function to create custom upload middleware for different folders
const createUploadMiddleware = (customDir) => {
  return multer({
    storage: createStorage(customDir),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
  });
};

module.exports = upload;
module.exports.createUploadMiddleware = createUploadMiddleware;
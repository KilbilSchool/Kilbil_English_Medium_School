// utils/uploadToStorage.js
const { bucket } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload a file buffer to Firebase Storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder name in storage (e.g., 'staff')
 * @returns {Promise<String>} Public URL of uploaded file
 */
const uploadImageToStorage = async (file, folder = 'staff') => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;
    
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      reject(new Error(`Upload failed: ${error.message}`));
    });

    blobStream.on('finish', async () => {
      try {
        // Make file publicly accessible
        await blob.makePublic();
        
        // Construct public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        reject(new Error(`Failed to make file public: ${error.message}`));
      }
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { uploadImageToStorage };
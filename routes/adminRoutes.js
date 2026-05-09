// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyAdmin } = require('../middleware/authMiddleware'); // ← add this
const { db, admin } = require('../config/firebase'); // if needed
// --- Multer for hero slider ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Admin login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Get credentials from environment variables
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Check credentials
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    message: 'Login successful',
    token,
    admin: { email: ADMIN_EMAIL }
  });
});
// routes/adminRoutes.js (add these)
router.get('/fee-structure', verifyAdmin, async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('feeStructure').get();
    if (!doc.exists) return res.json({}); // empty defaults
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/fee-structure', verifyAdmin, async (req, res) => {
  try {
    const { fees } = req.body; // expects an object mapping class -> amount
    await db.collection('settings').doc('feeStructure').set({ fees, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



const heroMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/heroslider';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + unique + path.extname(file.originalname));
  }
});

const heroMediaFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;
  const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/.*|video\/.*/.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('Only images and videos are allowed'));
};

const heroMediaUpload = multer({
  storage: heroMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: heroMediaFilter
});

// --- Hero Slider Admin Routes ---
router.get('/hero-slider', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('herogallery')
      .orderBy('createdAt', 'desc')
      .get();
    const media = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hero-slider', verifyAdmin, heroMediaUpload.array('media', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No media uploaded' });
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const addedMedia = [];
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const url = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
      const docRef = await db.collection('herogallery').add({
        url,
        mediaType: isVideo ? 'video' : 'image',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      addedMedia.push({ id: docRef.id, url, mediaType: isVideo ? 'video' : 'image' });
    }
    res.status(201).json(addedMedia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hero-slider/:id', verifyAdmin, async (req, res) => {
  try {
    await db.collection('herogallery').doc(req.params.id).delete();
    res.json({ message: 'Media deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
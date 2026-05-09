// routes/galleryRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const galleryService = require('../services/galleryService');
const { verifyAdmin } = require('../middleware/authMiddleware');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// --- Public routes ---
// Get all events (for gallery display)
router.get('/events', async (req, res) => {
  try {
    const events = await galleryService.getAllEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get images for a specific event
router.get('/events/:eventId/images', async (req, res) => {
  try {
    const images = await galleryService.getImagesByEvent(req.params.eventId);
    // Convert local paths to URLs
    const imagesWithUrl = images.map(img => ({
      ...img,
      url: `${BASE_URL}/${img.url}` // url stored as relative path like 'uploads/images/filename.jpg'
    }));
    res.json(imagesWithUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin protected routes ---
// Create event
console.log('Right before POST /events, verifyAdmin type:', typeof verifyAdmin);
router.post('/events', verifyAdmin, async (req, res) => {
  try {
    const { name, year, description } = req.body;

    if (!name || !year) {
      return res.status(400).json({ error: 'Event name and year are required' });
    }

    // Ensure description is a string (empty string if missing)
    // and year is a number
    const eventData = {
      name: name.trim(),
      year: Number(year),
      description: description ? description.trim() : ''
    };

    const event = await galleryService.createEvent(eventData);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete event
router.delete('/events/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await galleryService.deleteEvent(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload multiple images to an event
router.post('/events/:eventId/images', verifyAdmin, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    // Build relative paths (normalize slashes for URL)
    const imagePaths = req.files.map(file => file.path.replace(/\\/g, '/'));
    const addedImages = await galleryService.addImages(req.params.eventId, imagePaths);
    res.status(201).json(addedImages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete single image
router.delete('/images/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await galleryService.deleteImage(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
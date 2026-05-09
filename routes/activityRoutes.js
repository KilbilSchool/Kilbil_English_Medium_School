// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const activityService = require('../services/activityService');
const { verifyAdmin } = require('../middleware/authMiddleware');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Public: get active activities (for homepage)
router.get('/active', async (req, res) => {
  try {
    const activities = await activityService.getActiveActivities();
    // Convert local image paths to full URLs (normalize slashes)
    const withUrls = activities.map(act => ({
      ...act,
      image: act.image ? `${BASE_URL}/${act.image.replace(/\\/g, '/')}` : null
    }));
    res.json(withUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all activities
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create activity (uses local disk storage)
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, active, link } = req.body;
    
    // Get the local file path from multer
    const imagePath = req.file ? req.file.path : '';
    
    const activity = await activityService.createActivity({
      title,
      description,
      type,
      active,
      link: link || '',
      image: imagePath
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update activity (uses local disk storage)
router.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, active, link } = req.body;
    const updateData = {
      title,
      description,
      type,
      active,
      link: link || ''
    };
    
    // If a new image was uploaded, add its path
    if (req.file) {
      updateData.image = req.file.path;
    }
    
    const updated = await activityService.updateActivity(req.params.id, updateData);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete activity
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await activityService.deleteActivity(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
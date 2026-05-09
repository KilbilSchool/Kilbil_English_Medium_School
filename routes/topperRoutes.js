const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const topperService = require('../services/topperService');
const topperUpload = require('../middleware/topperUploadMiddleware');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Public: get toppers for a specific year (default: current year)
router.get('/public', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear().toString();
    const toppers = await topperService.getToppersByYear(year);
    // Convert image paths to full URLs
    const withUrls = toppers.map(t => ({
      ...t,
      image: t.image ? `${BASE_URL}/${t.image.replace(/\\/g, '/')}` : null
    }));
    res.json(withUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all toppers (any year)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const toppers = await topperService.getAllToppers();
    res.json(toppers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create topper
router.post('/', verifyAdmin, topperUpload.single('image'), async (req, res) => {
  try {
    const { name, rank, marks, class: className, year } = req.body;
    if (!name || !rank || !marks || !className || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : '';
    const topper = await topperService.createTopper({
      name,
      rank,
      marks,
      class: className,
      year,
      image: imagePath
    });
    res.status(201).json(topper);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update topper
router.put('/:id', verifyAdmin, topperUpload.single('image'), async (req, res) => {
  try {
    const { name, rank, marks, class: className, year } = req.body;
    const updateData = { name, rank, marks, class: className, year };
    if (req.file) {
      updateData.image = req.file.path.replace(/\\/g, '/');
    }
    const updated = await topperService.updateTopper(req.params.id, updateData);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete topper
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await topperService.deleteTopper(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
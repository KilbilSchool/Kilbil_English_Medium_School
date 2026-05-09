// routes/noticeRoutes.js
const express = require('express');
const router = express.Router();
const { verifyTeacher, verifyAdmin } = require('../middleware/authMiddleware');
const noticeService = require('../services/noticeService');

// Teacher: Get own notices
router.get('/my-notices', verifyTeacher, async (req, res) => {
  try {
    const notices = await noticeService.getNoticesByTeacher(req.teacher.id);
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public/Student: Get notices by class (can be protected or public)
router.get('/class/:className', async (req, res) => {
  try {
    const notices = await noticeService.getNoticesByClass(req.params.className);
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Create notice
router.post('/', verifyTeacher, async (req, res) => {
  try {
    const { title, content, class: className } = req.body;
    if (!title || !content || !className) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const notice = await noticeService.createNotice(
      { title, content, class: className },
      req.teacher.id,
      req.teacher.name
    );
    res.status(201).json(notice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Teacher: Update own notice
router.put('/:id', verifyTeacher, async (req, res) => {
  try {
    // Optional: verify that the notice belongs to this teacher
    const notice = await noticeService.updateNotice(req.params.id, req.body);
    res.json(notice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Teacher: Delete own notice (or admin can delete any)
router.delete('/:id', verifyTeacher, async (req, res) => {
  try {
    const result = await noticeService.deleteNotice(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
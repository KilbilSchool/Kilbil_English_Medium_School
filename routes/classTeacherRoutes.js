// routes/classTeacherRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAdmin, verifyTeacher } = require('../middleware/authMiddleware');
const service = require('../services/classTeacherService');

// Admin: Assign class teacher
router.post('/assign', verifyAdmin, async (req, res) => {
  try {
    const { teacherId, teacherName, class: className } = req.body;
    if (!teacherId || !teacherName || !className) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const result = await service.assignClassTeacher(teacherId, teacherName, className);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Remove class teacher
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await service.removeClassTeacher(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Get my class (if I am a class teacher)
router.get('/my-class', verifyTeacher, async (req, res) => {
  try {
    const ct = await service.getClassTeacherByTeacherId(req.teacher.id);
    res.json(ct || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Get students of my class (class teacher only)
router.get('/my-students', verifyTeacher, async (req, res) => {
  try {
    const students = await service.getStudentsForClassTeacher(req.teacher.id);
    res.json(students);
  } catch (err) {
    res.status(403).json({ error: err.message }); // 403 if not class teacher
  }
});

module.exports = router;
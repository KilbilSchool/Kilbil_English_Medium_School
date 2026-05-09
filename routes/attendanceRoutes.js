// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { verifyTeacher } = require('../middleware/authMiddleware');
const requireClassTeacher = require('../middleware/classTeacherGuard');
const attendanceService = require('../services/attendanceService');

// Class teacher marks attendance for their class
router.post('/', verifyTeacher, requireClassTeacher, async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ studentId, status }]
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array required' });
    }
    const ct = req.classTeacher; // from requireClassTeacher middleware
    const result = await attendanceService.markAttendance(
      ct.class,
      date,
      records,
      req.teacher.id
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a class on a specific date (class teacher)
router.get('/class/:className/:date', verifyTeacher, requireClassTeacher, async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceByDate(
      req.params.className,
      req.params.date
    );
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a specific student (optional, teacher/student)
router.get('/student/:studentId', verifyTeacher, async (req, res) => {
  try {
    const attendance = await attendanceService.getStudentAttendance(req.params.studentId);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
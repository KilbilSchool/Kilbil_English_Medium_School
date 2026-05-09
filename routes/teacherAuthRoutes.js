const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const staffService = require('../services/staffService');

router.post('/login', async (req, res) => {
  const { staffCode, password } = req.body;
  if (!staffCode || !password) {
    return res.status(400).json({ error: 'Staff code and password required' });
  }
  try {
    const teacher = await staffService.verifyTeacherLogin(staffCode, password);
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: teacher.id, role: 'teacher', name: teacher.name, staffCode: teacher.staffCode },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, teacher: { id: teacher.id, name: teacher.name, staffCode: teacher.staffCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
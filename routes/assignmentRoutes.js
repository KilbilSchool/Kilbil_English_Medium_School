// routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyTeacher } = require('../middleware/authMiddleware');
const assignmentService = require('../services/assignmentService');

// Teacher: Create assignment
router.post('/', verifyTeacher, async (req, res) => {
  try {
    const { title, description, class: className, subject, dueDate } = req.body;
    if (!title || !className || !subject) {
      return res.status(400).json({ error: 'Title, class, and subject are required' });
    }
    const assignment = await assignmentService.createAssignment({
      title,
      description,
      class: className,
      subject,
      dueDate,
      teacherId: req.teacher.id,
      teacherName: req.teacher.name
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Get own assignments
router.get('/my-assignments', verifyTeacher, async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignmentsByTeacher(req.teacher.id);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public/Student: Get assignments by class
router.get('/class/:className', async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignmentsByClass(req.params.className);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Update assignment
router.put('/:id', verifyTeacher, async (req, res) => {
  try {
    // Optional: verify ownership
    const updated = await assignmentService.updateAssignment(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Delete assignment
router.delete('/:id', verifyTeacher, async (req, res) => {
  try {
    const result = await assignmentService.deleteAssignment(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
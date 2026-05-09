// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyTeacher, verifyAdmin } = require('../middleware/authMiddleware');
const studentService = require('../services/studentService');
const requireClassTeacher = require('../middleware/classTeacherGuard');

// -------------------------------------------------------------------
// PUBLIC ROUTE – Student Login (server‑side, optional)
// -------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const student = await studentService.verifyStudentLogin(email, password);
    if (!student) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Remove sensitive fields before sending
    const { password: _, ...safeStudent } = student;
    res.json({ student: safeStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// TEACHER ROUTES
// -------------------------------------------------------------------
// Teacher: Get students by class (only for classes they teach)
router.get('/class/:className', verifyTeacher, async (req, res) => {
  try {
    const students = await studentService.getStudentsByClass(req.params.className);
    // Strip passwords from response
    const safeStudents = students.map(s => {
      const { password, ...rest } = s;
      return rest;
    });
    res.json(safeStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// ADMIN ROUTES
// -------------------------------------------------------------------
// Admin: Create student
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      class: className,
      rollNo,
      parentName,
      parentPhone,
      email,
      password
    } = req.body;

    if (!name || !className || !rollNo) {
      return res.status(400).json({ error: 'Name, class, and roll number are required' });
    }

    const student = await studentService.createStudent({
      name,
      class: className,
      rollNo,
      parentName,
      parentPhone,
      email,
      password
    });

    // Remove password from response
    const { password: _, ...safeStudent } = student;
    res.status(201).json(safeStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Update student
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      class: className,
      rollNo,
      parentName,
      parentPhone,
      email,
      password
    } = req.body;

    if (!name || !className || !rollNo) {
      return res.status(400).json({ error: 'Name, class, and roll number are required' });
    }

    const student = await studentService.updateStudent(req.params.id, {
      name,
      class: className,
      rollNo,
      parentName,
      parentPhone,
      email,
      password
    });

    const { password: _, ...safeStudent } = student;
    res.json(safeStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Delete student
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await studentService.deleteStudent(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Class teacher can add a student to their own class
router.post('/class-teacher', verifyTeacher, requireClassTeacher, async (req, res) => {
  try {
    const { name, rollNo, parentName, parentPhone, email, password } = req.body;
    if (!name || !rollNo) {
      return res.status(400).json({ error: 'Name and roll number are required' });
    }
    const student = await studentService.createStudent({
      name,
      class: req.classTeacher.class,   // automatic from guard
      rollNo,
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      email: email || '',
      password: password || 'student123'
    });
    // Strip password before sending response
    const { password: _, ...safeStudent } = student;
    res.status(201).json(safeStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Class teacher can update a student in any of their assigned classes
router.put('/class-teacher/:id', verifyTeacher, requireClassTeacher, async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if the student's class is among the teacher's assigned classes
    if (!req.classTeacherClasses.includes(student.class)) {
      return res.status(403).json({ error: 'You can only edit students in your own classes' });
    }

    const updated = await studentService.updateStudent(req.params.id, req.body);
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
// routes/teacherAssignmentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAdmin, verifyTeacher } = require('../middleware/authMiddleware');
const assignmentService = require('../services/teacherAssignmentService');
const { db } = require('../config/firebase'); // needed for uniqueness check

const ASSIGNMENTS_COLLECTION = 'teacherAssignments';

// Helper: Check if a class already has a class teacher (excluding a specific assignment id)
const hasClassTeacherConflict = async (className, excludeId = null) => {
  let query = db.collection(ASSIGNMENTS_COLLECTION)
    .where('class', '==', className)
    .where('isClassTeacher', '==', true);
  const snapshot = await query.get();
  if (excludeId) {
    return snapshot.docs.some(doc => doc.id !== excludeId);
  }
  return !snapshot.empty;
};

// Public: Get assignments grouped by class
router.get('/grouped', async (req, res) => {
  try {
    const grouped = await assignmentService.getAssignmentsGroupedByClass();
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all assignments
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const assignments = await assignmentService.getAllAssignments();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create assignment
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { 
      teacherId, 
      teacherName, 
      class: className, 
      subject, 
      isClassTeacher 
    } = req.body;

    // Basic validation
    if (!teacherId || !teacherName || !className) {
      return res.status(400).json({ error: 'Teacher ID, Teacher Name, and Class are required' });
    }
    // Subject is optional now

    // If this assignment is a class teacher, ensure no other class teacher exists for the same class
    if (isClassTeacher === true) {
      const conflict = await hasClassTeacherConflict(className);
      if (conflict) {
        return res.status(409).json({ 
          error: `Class ${className} already has a class teacher. Only one class teacher per class is allowed.` 
        });
      }
    }

    const assignment = await assignmentService.createAssignment({
      teacherId,
      teacherName,
      class: className,
      subject: subject || null,
      isClassTeacher: isClassTeacher || false
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update assignment
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      teacherId, 
      teacherName, 
      class: className, 
      subject, 
      isClassTeacher 
    } = req.body;

    // Check if assignment exists
    const existingDoc = await db.collection(ASSIGNMENTS_COLLECTION).doc(id).get();
    if (!existingDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // If setting as class teacher, check uniqueness (excluding this assignment)
    if (isClassTeacher === true) {
      const conflict = await hasClassTeacherConflict(className, id);
      if (conflict) {
        return res.status(409).json({ 
          error: `Class ${className} already has a class teacher. Only one class teacher per class is allowed.` 
        });
      }
    }

    const updated = await assignmentService.updateAssignment(id, {
      teacherId,
      teacherName,
      class: className,
      subject: subject || null,
      isClassTeacher: isClassTeacher || false
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete assignment
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await assignmentService.deleteAssignment(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Get my assignments
router.get('/my-assignments', verifyTeacher, async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const assignments = await assignmentService.getAssignmentsByTeacher(teacherId);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
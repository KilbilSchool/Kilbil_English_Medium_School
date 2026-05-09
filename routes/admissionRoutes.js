// routes/admissionRoutes.js
const express = require('express');
const router = express.Router();
const { verifyClerk, verifyAdmin } = require('../middleware/authMiddleware');
const admissionService = require('../services/admissionService');

// Clerk/Admin: Create admission
router.post('/', verifyClerk, async (req, res) => {
  try {
    const admission = await admissionService.createAdmission(req.body);
    res.status(201).json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Clerk/Admin: Get all admissions
router.get('/', verifyClerk, async (req, res) => {
  try {
    const admissions = await admissionService.getAllAdmissions();
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clerk/Admin: Get single admission
router.get('/:id', verifyClerk, async (req, res) => {
  try {
    const admission = await admissionService.getAdmissionById(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Not found' });
    res.json(admission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clerk/Admin: Update admission
router.put('/:id', verifyClerk, async (req, res) => {
  try {
    const updated = await admissionService.updateAdmission(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Clerk/Admin: Delete admission
router.delete('/:id', verifyClerk, async (req, res) => {
  try {
    const result = await admissionService.deleteAdmission(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
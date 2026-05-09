// routes/enquiryRoutes.js
const express = require('express');
const router = express.Router();
const enquiryService = require('../services/enquiryService');
const { verifyAdmin } = require('../middleware/authMiddleware');  // ✅ Destructure import

// -------------------------------------------------------------------
// PUBLIC ROUTE – No authentication required (parents/students)
// -------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      phone,
      email,
      class: selectedClass,
      message
    } = req.body;

    if (!studentName || !parentName || !phone || !selectedClass) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const enquiry = await enquiryService.createEnquiry({
      studentName,
      parentName,
      phone,
      email: email || '',
      class: selectedClass,
      message: message || ''
    });

    res.status(201).json(enquiry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// ADMIN ROUTES – Protected by JWT authentication
// -------------------------------------------------------------------

// Get all enquiries (for admin panel)
router.get('/', verifyAdmin, async (req, res) => {   // ✅ verifyAdmin is now a function
  try {
    const enquiries = await enquiryService.getAllEnquiries();
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update enquiry status (new / read / replied)
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const result = await enquiryService.updateEnquiryStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an enquiry
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await enquiryService.deleteEnquiry(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
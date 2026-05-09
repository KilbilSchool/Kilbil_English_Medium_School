// routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadImageToStorage } = require('../utils/uploadToStorage');
const staffService = require('../services/staffService');
const { verifyAdmin } = require('../middleware/authMiddleware'); // 👈 Import verifyAdmin
const { db, admin } = require('../config/firebase'); // 👈 Import db and admin
const bcrypt = require('bcrypt');

// @route   GET /api/staff
// @desc    Get all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await staffService.getAllStaff();
    res.json(staff);
  } catch (error) {
    console.error('GET /staff error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/staff/:id
// @desc    Get single staff member by ID
router.get('/:id', async (req, res) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    console.error('GET /staff/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/staff
// @desc    Create a new staff member with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = await uploadImageToStorage(req.file, 'staff');
    
    const staffData = {
      name: req.body.name,
      designation: req.body.designation,
      education: req.body.education || '',
      section: req.body.section || 'Group 1',
      isLeadership: req.body.isLeadership === 'true' || req.body.isLeadership === true,
      image: imageUrl || ''
    };
    
    if (!staffData.name || !staffData.designation) {
      return res.status(400).json({ error: 'Name and designation are required' });
    }
    
    const newStaff = await staffService.createStaff(staffData);
    res.status(201).json(newStaff);
  } catch (error) {
    console.error('POST /staff error:', error);
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/staff/:id
// @desc    Update a staff member (with optional new image)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    let imageUrl;
    if (req.file) {
      imageUrl = await uploadImageToStorage(req.file, 'staff');
    }
    
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.designation) updateData.designation = req.body.designation;
    if (req.body.education !== undefined) updateData.education = req.body.education;
    if (req.body.section) updateData.section = req.body.section;
    if (req.body.isLeadership !== undefined) {
      updateData.isLeadership = req.body.isLeadership === 'true' || req.body.isLeadership === true;
    }
    if (imageUrl) updateData.image = imageUrl;
    
    const updatedStaff = await staffService.updateStaff(req.params.id, updateData);
    res.json(updatedStaff);
  } catch (error) {
    console.error('PUT /staff/:id error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/staff/:id
// @desc    Delete a staff member
router.delete('/:id', async (req, res) => {
  try {
    const result = await staffService.deleteStaff(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('DELETE /staff/:id error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/staff/:id/password
// @desc    Set/update teacher password and staff code (admin only)
router.patch('/:id/password', verifyAdmin, async (req, res) => {
  try {
    const { password, staffCode } = req.body;
    if (!password || !staffCode) {
      return res.status(400).json({ error: 'Password and staff code required' });
    }
    
    // Check if staffCode is already used by another teacher
    const existing = await db.collection('staff')
      .where('staffCode', '==', staffCode)
      .where(admin.firestore.FieldPath.documentId(), '!=', req.params.id)
      .get();
      
    if (!existing.empty) {
      return res.status(400).json({ error: 'Staff code already in use' });
    }
    
    // Use the service function instead of direct db access
    await staffService.setStaffPassword(req.params.id, password, staffCode);
    
    res.json({ message: 'Password set successfully' });
  } catch (err) {
    console.error('PATCH /staff/:id/password error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
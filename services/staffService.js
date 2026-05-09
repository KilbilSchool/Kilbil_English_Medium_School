// services/staffService.js
const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');

const STAFF_COLLECTION = 'staff';

/**
 * Get all staff members, ordered by section
 */
const getAllStaff = async () => {
  try {
    const snapshot = await db.collection(STAFF_COLLECTION)
      .orderBy('section')
      .get();
    
    const staff = [];
    snapshot.forEach(doc => {
      staff.push({ id: doc.id, ...doc.data() });
    });
    return staff;
  } catch (error) {
    throw new Error(`Error fetching staff: ${error.message}`);
  }
};

/**
 * Get a single staff member by ID
 */
const getStaffById = async (id) => {
  try {
    const docRef = db.collection(STAFF_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw new Error(`Error fetching staff member: ${error.message}`);
  }
};

/**
 * Create a new staff member
 */
const createStaff = async (staffData) => {
  try {
    const dataWithTimestamp = {
      ...staffData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db.collection(STAFF_COLLECTION).add(dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
  } catch (error) {
    throw new Error(`Error creating staff: ${error.message}`);
  }
};

/**
 * Update an existing staff member
 */
const updateStaff = async (id, staffData) => {
  try {
    const docRef = db.collection(STAFF_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error('Staff member not found');
    }
    
    const updatedData = {
      ...staffData,
      updatedAt: new Date().toISOString()
    };
    
    await docRef.update(updatedData);
    return { id, ...updatedData };
  } catch (error) {
    throw new Error(`Error updating staff: ${error.message}`);
  }
};

/**
 * Delete a staff member
 */
const deleteStaff = async (id) => {
  try {
    const docRef = db.collection(STAFF_COLLECTION).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error('Staff member not found');
    }
    
    await docRef.delete();
    return { message: 'Staff member deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting staff: ${error.message}`);
  }
};

/**
 * Set or update a teacher's password and staff code
 */
const setStaffPassword = async (id, plainPassword, staffCode) => {
  const hashed = await bcrypt.hash(plainPassword, 10);
  await db.collection('staff').doc(id).update({ 
    password: hashed,
    staffCode: staffCode
  });
  return true;
};

/**
 * Verify teacher login credentials
 */
const verifyTeacherLogin = async (staffCode, plainPassword) => {
  if (!staffCode) return null;
  
  const snapshot = await db.collection('staff')
    .where('staffCode', '==', staffCode)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  
  const staff = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  
  if (!staff.password) return null;
  
  const match = await bcrypt.compare(plainPassword, staff.password);
  return match ? staff : null;
};

// ✅ Export ALL functions
module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffPassword,      // 👈 Added
  verifyTeacherLogin     // 👈 Added
};
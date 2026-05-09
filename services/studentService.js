// services/studentService.js
const { db } = require('../config/firebase');

const STUDENTS_COLLECTION = 'students';

/**
 * Get all students in a specific class
 */
const getStudentsByClass = async (className) => {
  const snapshot = await db.collection(STUDENTS_COLLECTION)
    .where('class', '==', className)
    .orderBy('rollNo')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Create a new student (admin only)
 * Includes email, password, and role fields for student login.
 */
const createStudent = async (studentData) => {
  const data = {
    name: studentData.name,
    class: studentData.class,
    rollNo: studentData.rollNo,
    parentName: studentData.parentName || '',
    parentPhone: studentData.parentPhone || '',
    email: studentData.email || '',
    password: studentData.password || 'student123',   // default password
    role: 'student',                                  // fixed role
    createdAt: new Date().toISOString()
  };
  const docRef = await db.collection(STUDENTS_COLLECTION).add(data);
  return { id: docRef.id, ...data };
};

/**
 * Update student (admin only)
 * Allows updating of email and password if provided.
 */
const updateStudent = async (id, studentData) => {
  // Remove undefined fields to avoid Firestore errors
  const sanitized = {};
  for (const [key, value] of Object.entries(studentData)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  await db.collection('students').doc(id).update({
    ...sanitized,
    updatedAt: new Date().toISOString()
  });
  return { id, ...sanitized };
};

/**
 * Delete student
 */
const deleteStudent = async (id) => {
  await db.collection(STUDENTS_COLLECTION).doc(id).delete();
  return { message: 'Student deleted' };
};

/**
 * Verify student login credentials (for backend API usage)
 * Checks email and password, and ensures the role is 'student'.
 */
const verifyStudentLogin = async (email, plainPassword) => {
  const snapshot = await db.collection(STUDENTS_COLLECTION)
    .where('email', '==', email)
    .where('role', '==', 'student')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const student = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

  // Compare plain text password (in production, use bcrypt.compare)
  if (student.password !== plainPassword) return null;

  return student;
};
const getStudentById = async (id) => {
  const doc = await db.collection('students').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};
const getAllStudents = async () => {
  const snapshot = await db.collection('students').orderBy('class').orderBy('rollNo').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  getStudentsByClass,
  createStudent,
  updateStudent,
  deleteStudent,
  verifyStudentLogin,
  getStudentById ,
  getAllStudents  // optional: for server-side authentication
};
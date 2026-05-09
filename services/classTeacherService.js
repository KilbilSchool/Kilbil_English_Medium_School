// services/classTeacherService.js
const { db, admin } = require('../config/firebase');

const COLLECTION = 'classTeachers';

// Get class teacher for a specific class
const getClassTeacherByClass = async (className) => {
  const snapshot = await db.collection(COLLECTION)
    .where('class', '==', className)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Get class teacher assignment for a specific teacher
const getClassTeacherByTeacherId = async (teacherId) => {
  const snapshot = await db.collection(COLLECTION)
    .where('teacherId', '==', teacherId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Assign a class teacher (admin only)
const assignClassTeacher = async (teacherId, teacherName, className) => {
  // Check if class already has a class teacher
  const existing = await getClassTeacherByClass(className);
  if (existing) {
    throw new Error(`Class ${className} already has a class teacher assigned`);
  }
  const data = {
    teacherId,
    teacherName,
    class: className,
    assignedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  const ref = await db.collection(COLLECTION).add(data);
  return { id: ref.id, ...data };
};

// Remove class teacher assignment (admin only)
const removeClassTeacher = async (id) => {
  await db.collection(COLLECTION).doc(id).delete();
  return { message: 'Class teacher assignment removed' };
};

// Get all students of the class teacher's class
const getStudentsForClassTeacher = async (teacherId) => {
  const ct = await getClassTeacherByTeacherId(teacherId);
  if (!ct) throw new Error('You are not assigned as a class teacher');
  // Reuse existing student service function
  const { getStudentsByClass } = require('./studentService');
  return getStudentsByClass(ct.class);
};

module.exports = {
  getClassTeacherByClass,
  getClassTeacherByTeacherId,
  assignClassTeacher,
  removeClassTeacher,
  getStudentsForClassTeacher
};
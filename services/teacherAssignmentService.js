// services/teacherAssignmentService.js
const { db } = require('../config/firebase');

const ASSIGNMENTS_COLLECTION = 'teacherAssignments';

// Get all assignments (optionally filter by teacher or class)
const getAllAssignments = async () => {
  const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
    .orderBy('class')
    .orderBy('subject')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get assignments grouped by class (for public display)
const getAssignmentsGroupedByClass = async () => {
  const assignments = await getAllAssignments();
  const grouped = {};
  assignments.forEach(a => {
    if (!grouped[a.class]) grouped[a.class] = [];
    grouped[a.class].push({
      subject: a.subject,
      teacherId: a.teacherId,
      teacherName: a.teacherName,
      isClassTeacher: a.isClassTeacher || false   // include flag
    });
  });
  return grouped;
};

// Create a new assignment (with optional subject and class teacher flag)
const createAssignment = async (data) => {
  const cleaned = {
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    class: data.class,
    subject: data.subject || null,               // optional – can be null
    isClassTeacher: data.isClassTeacher || false, // new field
    createdAt: new Date().toISOString()
  };
  const docRef = await db.collection(ASSIGNMENTS_COLLECTION).add(cleaned);
  return { id: docRef.id, ...cleaned };
};

// Update an assignment
const updateAssignment = async (id, data) => {
  const updateData = {
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    class: data.class,
    subject: data.subject || null,
    isClassTeacher: data.isClassTeacher || false,
    updatedAt: new Date().toISOString()
  };
  await db.collection(ASSIGNMENTS_COLLECTION).doc(id).update(updateData);
  return { id, ...updateData };
};

// Delete an assignment
const deleteAssignment = async (id) => {
  await db.collection(ASSIGNMENTS_COLLECTION).doc(id).delete();
  return { message: 'Assignment deleted' };
};

const getAssignmentsByTeacher = async (teacherId) => {
  const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
    .where('teacherId', '==', teacherId)
    .orderBy('class')
    .orderBy('subject')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  getAllAssignments,
  getAssignmentsGroupedByClass,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByTeacher
};
// services/assignmentService.js
const { db } = require('../config/firebase');

const ASSIGNMENTS_COLLECTION = 'assignments';

const createAssignment = async (data) => {
  const cleaned = {
    title: data.title,
    description: data.description || '',
    class: data.class,
    subject: data.subject,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    dueDate: data.dueDate || null,
    attachments: data.attachments || [],
    createdAt: new Date().toISOString()
  };
  const docRef = await db.collection(ASSIGNMENTS_COLLECTION).add(cleaned);
  return { id: docRef.id, ...cleaned };
};

const getAssignmentsByTeacher = async (teacherId) => {
  const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getAssignmentsByClass = async (className) => {
  const snapshot = await db.collection(ASSIGNMENTS_COLLECTION)
    .where('class', '==', className)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateAssignment = async (id, data) => {
  await db.collection(ASSIGNMENTS_COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
};

const deleteAssignment = async (id) => {
  await db.collection(ASSIGNMENTS_COLLECTION).doc(id).delete();
  return { message: 'Assignment deleted' };
};

module.exports = {
  createAssignment,
  getAssignmentsByTeacher,
  getAssignmentsByClass,
  updateAssignment,
  deleteAssignment
};
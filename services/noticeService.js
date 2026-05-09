// services/noticeService.js
const { db } = require('../config/firebase');

const NOTICES_COLLECTION = 'notices';

/**
 * Get notices created by a specific teacher (or all for a class)
 */
const getNoticesByTeacher = async (teacherId) => {
  const snapshot = await db.collection(NOTICES_COLLECTION)
    .where('createdBy', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get notices for a specific class (for students/parents)
 */
const getNoticesByClass = async (className) => {
  const snapshot = await db.collection(NOTICES_COLLECTION)
    .where('class', '==', className)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Create a new notice
 */
const createNotice = async (noticeData, teacherId, teacherName) => {
  const data = {
    ...noticeData,
    createdBy: teacherId,
    teacherName: teacherName,
    createdAt: new Date().toISOString()
  };
  const docRef = await db.collection(NOTICES_COLLECTION).add(data);
  return { id: docRef.id, ...data };
};

/**
 * Update a notice
 */
const updateNotice = async (id, noticeData) => {
  await db.collection(NOTICES_COLLECTION).doc(id).update({
    ...noticeData,
    updatedAt: new Date().toISOString()
  });
  return { id, ...noticeData };
};

/**
 * Delete a notice
 */
const deleteNotice = async (id) => {
  await db.collection(NOTICES_COLLECTION).doc(id).delete();
  return { message: 'Notice deleted' };
};

module.exports = {
  getNoticesByTeacher,
  getNoticesByClass,
  createNotice,
  updateNotice,
  deleteNotice
};
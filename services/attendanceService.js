// services/attendanceService.js
const { db, admin } = require('../config/firebase');

const COLLECTION = 'attendance';

/**
 * Mark attendance for a list of students on a specific date.
 * Expects an array of { studentId, status } where status is 'present', 'absent', or 'late'.
 */
const markAttendance = async (classValue, date, records, markedBy) => {
  const batch = db.batch();
  const dateStr = date; // 'YYYY-MM-DD'
  const results = [];

  for (const record of records) {
    // Use a composite ID to avoid duplicates: studentId_date
    const docId = `${record.studentId}_${dateStr}`;
    const ref = db.collection(COLLECTION).doc(docId);
    const data = {
      studentId: record.studentId,
      class: classValue,
      date: dateStr,
      status: record.status,
      markedBy: markedBy, // teacherId
      markedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(ref, data, { merge: true });
    results.push({ id: docId, ...data });
  }

  await batch.commit();
  return results;
};

/**
 * Get attendance for a class on a specific date.
 */
const getAttendanceByDate = async (classValue, date) => {
  const snapshot = await db.collection(COLLECTION)
    .where('class', '==', classValue)
    .where('date', '==', date)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get attendance summary for a student (optional).
 */
const getStudentAttendance = async (studentId) => {
  const snapshot = await db.collection(COLLECTION)
    .where('studentId', '==', studentId)
    .orderBy('date', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = { markAttendance, getAttendanceByDate, getStudentAttendance };
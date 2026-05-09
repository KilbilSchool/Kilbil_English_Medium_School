// services/admissionService.js
const { db, admin } = require('../config/firebase');

const COLLECTION = 'admissions';

const getAllAdmissions = async () => {
  const snapshot = await db.collection(COLLECTION)
    .orderBy('dateOfAdmission', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getAdmissionById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const createAdmission = async (data) => {
  // If studentId is provided, optionally create a student record
  const admissionData = {
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Check if student with that studentId already exists
  if (data.studentId) {
    const existingStudent = await db.collection('students')
      .where('studentId', '==', data.studentId)
      .limit(1)
      .get();
    if (!existingStudent.empty) {
      throw new Error('A student with this ID already exists');
    }

    // Create student document (optional – comment out if you just want admissions)
    await db.collection('students').doc(data.studentId).set({
      studentId: data.studentId,
      name: data.fullName,
      class: data.admissionClass,
      rollNo: '', // can be assigned later
      parentName: data.fatherName || data.motherName || '',
      parentPhone: '',
      email: '',
      password: 'student123',
      role: 'student',
      motherName: data.motherName,
      fatherName: data.fatherName,
      nationality: data.nationality,
      motherTongue: data.motherTongue,
      religion: data.religion,
      caste: data.caste,
      subCaste: data.subCaste,
      placeOfBirth: data.placeOfBirth,
      dob: data.dob,
      previousSchool: data.previousSchool,
      admissionClass: data.admissionClass,
      dateOfAdmission: data.dateOfAdmission,
      currentClass: data.currentClass || data.admissionClass,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  const ref = await db.collection(COLLECTION).add(admissionData);
  return { id: ref.id, ...admissionData };
};

const updateAdmission = async (id, data) => {
  await db.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { id, ...data };
};

const deleteAdmission = async (id) => {
  await db.collection(COLLECTION).doc(id).delete();
  return { message: 'Admission deleted' };
};

module.exports = {
  getAllAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission
};
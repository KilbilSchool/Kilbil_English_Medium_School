// services/enquiryService.js
const { db } = require('../config/firebase');

const ENQUIRY_COLLECTION = 'enquiries';

const getAllEnquiries = async () => {
  const snapshot = await db.collection(ENQUIRY_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createEnquiry = async (enquiryData) => {
  const data = {
    ...enquiryData,
    createdAt: new Date().toISOString(),
    status: 'new' // new, read, replied
  };
  const docRef = await db.collection(ENQUIRY_COLLECTION).add(data);
  return { id: docRef.id, ...data };
};

const updateEnquiryStatus = async (id, status) => {
  await db.collection(ENQUIRY_COLLECTION).doc(id).update({ status });
  return { id, status };
};

const deleteEnquiry = async (id) => {
  await db.collection(ENQUIRY_COLLECTION).doc(id).delete();
  return { message: 'Enquiry deleted' };
};

module.exports = {
  getAllEnquiries,
  createEnquiry,
  updateEnquiryStatus,
  deleteEnquiry
};
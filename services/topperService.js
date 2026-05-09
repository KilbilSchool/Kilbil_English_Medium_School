const { db } = require('../config/firebase');

const COLLECTION = 'toppers';

const getAllToppers = async () => {
  const snapshot = await db.collection(COLLECTION)
    .orderBy('class')
    .orderBy('rank')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getToppersByYear = async (year) => {
  const snapshot = await db.collection(COLLECTION)
    .where('year', '==', year)
    .orderBy('class')
    .orderBy('rank')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createTopper = async (data) => {
  const doc = { ...data, createdAt: new Date().toISOString() };
  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, ...doc };
};

const updateTopper = async (id, data) => {
  await db.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
};

const deleteTopper = async (id) => {
  await db.collection(COLLECTION).doc(id).delete();
  return { message: 'Topper deleted' };
};

module.exports = {
  getAllToppers,
  getToppersByYear,
  createTopper,
  updateTopper,
  deleteTopper
};
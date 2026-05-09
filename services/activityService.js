// services/activityService.js
const { db } = require('../config/firebase');

const ACTIVITIES_COLLECTION = 'activities';

const getAllActivities = async () => {
  const snapshot = await db.collection(ACTIVITIES_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getActiveActivities = async () => {
  const snapshot = await db.collection(ACTIVITIES_COLLECTION)
    .where('active', '==', true)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createActivity = async (activityData) => {
  const cleanedData = {
    ...activityData,
    active: activityData.active === 'true' || activityData.active === true,
    createdAt: new Date().toISOString()
  };
  const docRef = await db.collection(ACTIVITIES_COLLECTION).add(cleanedData);
  return { id: docRef.id, ...cleanedData };
};

const updateActivity = async (id, activityData) => {
  const cleanedData = {
    ...activityData,
    active: activityData.active === 'true' || activityData.active === true,
    updatedAt: new Date().toISOString()
  };
  await db.collection(ACTIVITIES_COLLECTION).doc(id).update(cleanedData);
  return { id, ...cleanedData };
};

const deleteActivity = async (id) => {
  await db.collection(ACTIVITIES_COLLECTION).doc(id).delete();
  return { message: 'Activity deleted' };
};

module.exports = {
  getAllActivities,
  getActiveActivities,
  createActivity,
  updateActivity,
  deleteActivity
};
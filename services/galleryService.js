// services/galleryService.js
const { db } = require('../config/firebase');

const EVENTS_COLLECTION = 'galleryEvents';
const IMAGES_COLLECTION = 'galleryImages';

// ---------- EVENTS ----------
const getAllEvents = async () => {
  // Note: Sorting by 'year' (desc) and 'createdAt' (desc) may require a composite index.
  // If you get an index error, create the index from the Firebase console link in the error.
  const snapshot = await db.collection(EVENTS_COLLECTION)
    .orderBy('year', 'desc')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createEvent = async (eventData) => {
  // Clean data to remove any undefined fields
  const cleanedData = {
    name: eventData.name?.trim() || '',
    year: typeof eventData.year === 'number' ? eventData.year : parseInt(eventData.year) || new Date().getFullYear(),
    description: eventData.description?.trim() || '',
    createdAt: new Date().toISOString()
  };

  const docRef = await db.collection(EVENTS_COLLECTION).add(cleanedData);
  return { id: docRef.id, ...cleanedData };
};

const deleteEvent = async (id) => {
  // Delete all images in this event first
  const imagesSnapshot = await db.collection(IMAGES_COLLECTION)
    .where('eventId', '==', id)
    .get();
  const batch = db.batch();
  imagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(db.collection(EVENTS_COLLECTION).doc(id));
  await batch.commit();
  return { message: 'Event and its images deleted' };
};

// ---------- IMAGES ----------
const addImages = async (eventId, imagePaths) => {
  const batch = db.batch();
  const images = imagePaths.map(path => ({
    eventId,
    url: path, // relative path like 'uploads/images/filename.jpg'
    createdAt: new Date().toISOString()
  }));
  const addedImages = [];
  images.forEach(img => {
    const ref = db.collection(IMAGES_COLLECTION).doc();
    batch.set(ref, img);
    addedImages.push({ id: ref.id, ...img });
  });
  await batch.commit();
  return addedImages;
};

const getImagesByEvent = async (eventId) => {
  const snapshot = await db.collection(IMAGES_COLLECTION)
    .where('eventId', '==', eventId)
    .orderBy('createdAt', 'asc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const deleteImage = async (imageId) => {
  await db.collection(IMAGES_COLLECTION).doc(imageId).delete();
  return { message: 'Image deleted' };
};

module.exports = {
  getAllEvents,
  createEvent,
  deleteEvent,
  addImages,
  getImagesByEvent,
  deleteImage
};
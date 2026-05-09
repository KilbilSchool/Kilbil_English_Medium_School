// config/firebase.js
const admin = require('firebase-admin');

// Path to your service account key file
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'kilbil-school.firebasestorage.app' // from your frontend config
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

console.log('🔥 Firebase Admin initialized');

module.exports = { db, bucket, admin };
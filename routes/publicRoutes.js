const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.get('/hero-slider', async (req, res) => {
  try {
    const snapshot = await db.collection('herogallery')
      .orderBy('createdAt', 'desc')
      .get();
    const media = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
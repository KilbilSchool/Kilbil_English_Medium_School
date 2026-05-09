// routes/clerkAuthRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const CLERK_EMAIL = process.env.CLERK_EMAIL;
  const CLERK_PASSWORD = process.env.CLERK_PASSWORD;

  // Debug logs (remove after testing)
  console.log('Received:', email, password);
  console.log('Expected:', CLERK_EMAIL, CLERK_PASSWORD);

  if (email !== CLERK_EMAIL || password !== CLERK_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { role: 'clerk', email: CLERK_EMAIL },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    role: 'clerk',
    user: { email: CLERK_EMAIL, name: 'Clerk' }
  });
});

module.exports = router;
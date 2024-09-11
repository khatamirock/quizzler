const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// User registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  try {
    const result = await db.collection('users').insertOne({
      username,
      password,
    });
    res.json({ message: 'User registered successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  try {
    const user = await db.collection('users').findOne({ username, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

module.exports = router;
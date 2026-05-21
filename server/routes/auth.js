import express from 'express';
import jwt from 'jsonwebtoken';

import {OAuth2Client}from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER: POST
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(401).json({ success: false, message: 'Username is already taken' });
    }

    // Create + save new user
    const newUser = new User({ username, password, role });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (error) {
    console.error("CRASH IN REGISTER ROUTE:", error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// LOGIN: POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Look up "username" in Database!!
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // JWT payload
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    // Create Tokens:
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Login successful: Send back the role to React (for UI/Tool)
    res.json({
      success: true,
      message: 'Login successful',
      token, //Send back to React!!!
      user: {
        username: user.username,
        role: user.role // 'admin' or 'customer'
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

router.post('/logout', (req, res) => {
  // With JWT, the server is stateless and doesn't store session data.
  res.json({ success: true, message: 'Logged out successfully' });
});

// GOOGLE OAuth sign-in and sign-up (without an account)
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    // Check Google ID/email
    let user = await User.findOne({ googleId });
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // Auto-create account for new user
    if (!user) {
      let cleanUsername = name ? name.replace(/\s+/g, '').toLowerCase() : 'user';
      let uniqueUsername = cleanUsername;
      let conflict = await User.findOne({ username: uniqueUsername });
      let count = 1;

      //add number to "username" if already exist
      while (conflict) {
        uniqueUsername = `${cleanUsername}${count}`;
        conflict = await User.findOne({ username: uniqueUsername });
        count++;
      }

      user = new User({ username: uniqueUsername, email, googleId, role: 'customer' });
      await user.save();
    }

    const payload = {
      id: user._id, 
      username: user.username, 
      role: user.role
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Google authentication processing failed' });
  }
});

// link session to Google acc
router.post('/sync-google', async (req, res) => {
  const { idToken } = req.body;
  const authHeader = req.headers['authorization'];
  const appToken = authHeader && authHeader.split(' ')[1];

  if (!appToken || !idToken) return res.status(401).json({ success: false, message: 'Credentials missing' });

  try {
    const decodedApp = jwt.verify(appToken, process.env.JWT_SECRET);
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email } = ticket.getPayload();

    const conflict = await User.findOne({ $or: [{ googleId }, { email }] });
    if (conflict && String(conflict._id) !== decodedApp.id) {
      return res.status(400).json({ success: false, message: 'This Google account is linked to another user' });
    }

    const user = await User.findById(decodedApp.id);
    user.googleId = googleId;
    user.email = email;
    await user.save();

    res.json({ success: true, message: 'Google account linked successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

// Seesion verification
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ authenticated: false });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ authenticated: false });
    res.json({ authenticated: true, user: { username: decoded.username, role: decoded.role } });
  });
});

export default router;
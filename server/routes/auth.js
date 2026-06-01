import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import {OAuth2Client}from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim();
}

function getGoogleClient() {
  const clientId = getGoogleClientId();

  if (!clientId) {
    return null;
  }

  return new OAuth2Client(clientId);
}

function getGoogleErrorMessage(error) {
  const message = error?.message || '';

  if (message.includes('Wrong recipient') || message.includes('audience')) {
    return 'Google Client ID mismatch. Make sure VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID use the same web client ID.';
  }

  if (message.includes('Token used too late') || message.includes('expired')) {
    return 'Google sign-in expired. Please try signing in again.';
  }

  if (error?.code === 11000) {
    return 'A Google account already exists with one of those account details.';
  }

  return 'Google authentication processing failed';
}

function getPublicUser(user) {
  return {
    username: user.username,
    email: user.email || '',
    role: user.role,
    gender: user.gender || '',
    age: user.age || '',
    location: user.location || ''
  };
}

function getPublicFriend(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email || ''
  };
}

async function getFriendsForUser(userId) {
  const user = await User.findById(userId)
    .populate('friends', 'username email')
    .lean();

  return user?.friends?.map(getPublicFriend) || [];
}

function signUserToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: '12h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Login is required' });
  }

  const jwtSecret = getJwtSecret();

  if (!jwtSecret) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Login is invalid or expired' });
  }
}

// REGISTER: POST
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(401).json({ success: false, message: 'Username is already taken' });
    }

    // Create + save new user
    const newUser = new User({ username, password, role: 'customer' });
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
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '12h' });

    // Login successful: Send back the role to React (for UI/Tool)
    res.json({
      success: true,
      message: 'Login successful',
      token, //Send back to React!!!
      user: getPublicUser(user)
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
    const client = getGoogleClient();
    const googleClientId = getGoogleClientId();

    if (!client) {
      return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Google sign-in cannot save the account.'
      });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account did not provide an email address' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check Google ID/email
    let user = await User.findOne({ googleId });
    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.googleId = googleId;
        user.email = cleanEmail;
        await user.save();
      }
    }

    // Auto-create account for new user
    if (!user) {
      const emailName = cleanEmail.split('@')[0];
      let cleanUsername = name || emailName || 'user';
      cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      let uniqueUsername = cleanUsername;
      let conflict = await User.findOne({ username: uniqueUsername });
      let count = 1;

      //add number to "username" if already exist
      while (conflict) {
        uniqueUsername = `${cleanUsername}${count}`;
        conflict = await User.findOne({ username: uniqueUsername });
        count++;
      }

      user = new User({ username: uniqueUsername, email: cleanEmail, googleId, role: 'customer' });
      await user.save();
    }

    const payload = {
      id: user._id, 
      username: user.username, 
      role: user.role
    }
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '12h' });
    res.json({ success: true, token, user: getPublicUser(user) });
  } catch (err) {
    console.error('Google authentication failed:', err.message);
    res.status(500).json({ success: false, message: getGoogleErrorMessage(err) });
  }
});

// link session to Google acc
router.post('/sync-google', async (req, res) => {
  const { idToken } = req.body;
  const authHeader = req.headers['authorization'];
  const appToken = authHeader && authHeader.split(' ')[1];

  if (!appToken || !idToken) return res.status(401).json({ success: false, message: 'Credentials missing' });

  try {
    const client = getGoogleClient();
    const jwtSecret = getJwtSecret();

    if (!client) {
      return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });
    }

    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const decodedApp = jwt.verify(appToken, jwtSecret);
    const ticket = await client.verifyIdToken({ idToken, audience: getGoogleClientId() });
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

router.patch('/profile', requireAuth, async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const gender = req.body.gender?.trim() || '';
  const location = req.body.location?.trim() || '';
  const age = req.body.age === '' || req.body.age === null || req.body.age === undefined
    ? undefined
    : Number(req.body.age);

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ success: false, message: 'Username must be 3 to 30 characters' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address' });
  }

  if (gender.length > 50) {
    return res.status(400).json({ success: false, message: 'Gender must be 50 characters or less' });
  }

  if (location.length > 120) {
    return res.status(400).json({ success: false, message: 'Location must be 120 characters or less' });
  }

  if (age !== undefined && (!Number.isInteger(age) || age < 1 || age > 120)) {
    return res.status(400).json({ success: false, message: 'Age must be between 1 and 120' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User was not found' });
    }

    const usernameTaken = await User.findOne({ username, _id: { $ne: user._id } });
    if (usernameTaken) {
      return res.status(409).json({ success: false, message: 'Username is already taken' });
    }

    if (email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailTaken) {
        return res.status(409).json({ success: false, message: 'Email is already used by another account' });
      }
    }

    user.username = username;
    user.email = email || undefined;
    user.gender = gender;
    user.age = age;
    user.location = location;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      token: signUserToken(user),
      user: getPublicUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update profile' });
  }
});

router.get('/friends', requireAuth, async (req, res) => {
  try {
    const friends = await getFriendsForUser(req.user.id);
    res.json({ success: true, friends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load friends' });
  }
});

router.post('/friends', requireAuth, async (req, res) => {
  const username = req.body.username?.trim();

  if (!username) {
    return res.status(400).json({ success: false, message: 'Enter a username to add' });
  }

  try {
    const friend = await User.findOne({ username });

    if (!friend) {
      return res.status(404).json({ success: false, message: 'No user found with that username' });
    }

    if (String(friend._id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User was not found' });
    }

    const alreadyAdded = user.friends.some((friendId) => String(friendId) === String(friend._id));
    if (alreadyAdded) {
      return res.status(409).json({ success: false, message: 'That user is already in your friends list' });
    }

    user.friends.push(friend._id);
    await user.save();

    const friends = await getFriendsForUser(user._id);
    res.status(201).json({ success: true, message: 'Friend added', friends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not add friend' });
  }
});

router.delete('/friends/:friendId', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.friendId)) {
    return res.status(400).json({ success: false, message: 'Friend id is invalid' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User was not found' });
    }

    user.friends = user.friends.filter((friendId) => String(friendId) !== req.params.friendId);
    await user.save();

    const friends = await getFriendsForUser(user._id);
    res.json({ success: true, message: 'Friend removed', friends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not remove friend' });
  }
});

// Session verification
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ authenticated: false, message: 'User was not found' });
    }

    res.json({ authenticated: true, user: getPublicUser(user) });
  } catch (error) {
    res.status(500).json({ authenticated: false, message: 'Could not load account' });
  }
});

export default router;

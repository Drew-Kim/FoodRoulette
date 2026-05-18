const express = require('express');

const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('../models/User');

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
module.exports = router;
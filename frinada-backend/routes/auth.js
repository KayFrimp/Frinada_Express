const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const User = require('../models/User');
const Rider = require('../models/Rider');

// Register new user
router.post('/register', async (req, res) => {
  try {
    // Debug request information - mask sensitive data
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Create a safe copy of req.body without sensitive data
    const safeBody = { ...req.body };
    if (safeBody.password) {
      safeBody.password = '[REDACTED]';
    }
    console.log('Request body:', safeBody);
    
    // Check if req.body is undefined
    if (!req.body) {
      return res.status(400).json({ 
        message: 'Request body is missing',
        error: 'The request body is undefined. Make sure you are sending JSON data with Content-Type: application/json header.'
      });
    }
    
    const { first_name, last_name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['first_name', 'last_name', 'email', 'phone', 'password'],
        received: Object.keys(req.body),
        example: {
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com",
          "phone": "1234567890",
          "password": "securepassword"
        }
      });
    }

    // Check if user already exists with email
    const emailExists = await User.findByEmail(email);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if user already exists with phone
    const phoneExists = await User.findByPhone(phone);
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Create new user
    const user = await User.create({
      first_name,
      last_name,
      email,
      phone,
      password,
      role: role || 'customer',
      status: 'active'
    });

    // If user is a rider, create rider profile
    if (user.role === 'rider') {
      await Rider.create(user.id);
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Debug request information - mask sensitive data
    console.log('Login request headers:', req.headers);
    console.log('Login Content-Type:', req.headers['content-type']);
    
    // Create a safe copy of req.body without sensitive data
    const safeBody = { ...req.body };
    if (safeBody.password) {
      safeBody.password = '[REDACTED]';
    }
    console.log('Login request body:', safeBody);
    
    // Check if req.body is undefined
    if (!req.body) {
      return res.status(400).json({ 
        message: 'Request body is missing',
        error: 'The request body is undefined. Make sure you are sending JSON data with Content-Type: application/json header.'
      });
    }
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password'],
        received: Object.keys(req.body),
        example: {
          "email": "john@example.com",
          "password": "securepassword"
        }
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
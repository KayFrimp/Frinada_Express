const User = require('../models/User');
const Rider = require('../models/Rider');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

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
      role: role || 'rider',
      status: 'active'
    });

    // If user is a rider, create rider profile
    if (user.role === 'rider') {
      await Rider.create(user.id);
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data and token
    res.status(201).json({
      success: true,
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
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get rider data if user is a rider
    let riderData = null;
    if (user.role === 'rider') {
      riderData = await Rider.findByUserId(user.id);
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        rider: riderData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get rider data if user is a rider
    let riderData = null;
    if (user.role === 'rider') {
      riderData = await Rider.findByUserId(user.id);
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        rider: riderData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 
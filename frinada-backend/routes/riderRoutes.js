const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const User = require('../models/User');
const Rider = require('../models/Rider');

// Get all riders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const [riders] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, status FROM users WHERE role = ?',
      ['rider']
    );
    res.json(riders);
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get rider by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rider] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, status FROM users WHERE id = ? AND role = ?',
      [req.params.id, 'rider']
    );

    if (rider.length === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json(rider[0]);
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get rider's current orders
router.get('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        CONCAT(r.first_name, ' ', r.last_name) as rider_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users r ON o.rider_id = r.id
      WHERE o.rider_id = ? AND o.status IN ('pending', 'assigned', 'picked_up')`,
      [req.params.id]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching rider orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update rider status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { is_available } = req.body;
    const rider = await Rider.findByUserId(req.params.id);

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    await rider.update({ is_available });
    res.json({ message: 'Rider status updated successfully' });
  } catch (error) {
    console.error('Error updating rider status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update rider location
router.patch('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const rider = await Rider.findByUserId(req.params.id);

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    await rider.updateLocation(latitude, longitude);
    res.json({ message: 'Rider location updated successfully' });
  } catch (error) {
    console.error('Error updating rider location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
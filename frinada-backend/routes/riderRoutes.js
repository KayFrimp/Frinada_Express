const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all riders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const [riders] = await pool.query(
      'SELECT id, username, email, status, current_location FROM users WHERE role = ?',
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
      'SELECT id, username, email, status, current_location FROM users WHERE id = ? AND role = ?',
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

// Update rider status
router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await pool.query(
      'UPDATE users SET status = ? WHERE id = ? AND role = ?',
      [status, req.params.id, 'rider']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({ message: 'Rider status updated successfully' });
  } catch (error) {
    console.error('Error updating rider status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update rider location
router.put('/:id/location', authenticateToken, authorizeRole(['rider']), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const [result] = await pool.query(
      'UPDATE users SET current_location = POINT(?, ?) WHERE id = ? AND role = ?',
      [longitude, latitude, req.params.id, 'rider']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({ message: 'Rider location updated successfully' });
  } catch (error) {
    console.error('Error updating rider location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get rider's current orders
router.get('/:id/orders', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.username as customer_name 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.rider_id = ? AND o.status IN ('assigned', 'picked_up', 'in_transit')`,
      [req.params.id]
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching rider orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
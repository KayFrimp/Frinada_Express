const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get order tracking details
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const [tracking] = await pool.query(
      `SELECT t.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        CONCAT(r.first_name, ' ', r.last_name) as rider_name
      FROM order_tracking t
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users r ON o.rider_id = r.id
      WHERE t.order_id = ?`,
      [req.params.orderId]
    );

    if (tracking.length === 0) {
      return res.status(404).json({ message: 'Tracking information not found' });
    }

    res.json(tracking[0]);
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order tracking
router.patch('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { status, location, estimated_arrival } = req.body;
    const [result] = await pool.query(
      `UPDATE order_tracking 
       SET status = ?, 
           location = POINT(?, ?),
           estimated_arrival = ?
       WHERE order_id = ?`,
      [status, location.longitude, location.latitude, estimated_arrival, req.params.orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tracking information not found' });
    }

    res.json({ message: 'Tracking updated successfully' });
  } catch (error) {
    console.error('Error updating tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tracking history for an order
router.get('/orders/:orderId/history', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const [history] = await pool.query(
      `SELECT * FROM tracking_history 
       WHERE order_id = ? 
       ORDER BY created_at DESC`,
      [orderId]
    );

    res.json(history);
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add tracking history entry
router.post('/orders/:orderId/history', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO tracking_history (order_id, status, location, notes)
       VALUES (?, ?, POINT(?, ?), ?)`,
      [orderId, status, location.longitude, location.latitude, notes]
    );

    res.status(201).json({
      message: 'Tracking history entry added successfully',
      entryId: result.insertId
    });
  } catch (error) {
    console.error('Error adding tracking history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
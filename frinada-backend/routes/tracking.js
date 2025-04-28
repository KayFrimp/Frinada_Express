const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get tracking information for an order
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const [tracking] = await pool.query(
      `SELECT t.*, o.status as order_status, o.delivery_address,
              u.username as customer_name, r.username as rider_name
       FROM tracking t
       LEFT JOIN orders o ON t.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users r ON o.rider_id = r.id
       WHERE t.order_id = ?`,
      [orderId]
    );

    if (tracking.length === 0) {
      return res.status(404).json({ message: 'Tracking information not found' });
    }

    res.json(tracking[0]);
  } catch (error) {
    console.error('Error fetching tracking information:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update tracking status
router.put('/orders/:orderId', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, estimated_delivery } = req.body;

    // Update tracking information
    const [result] = await pool.query(
      `INSERT INTO tracking (order_id, status, location, estimated_delivery)
       VALUES (?, ?, POINT(?, ?), ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       location = VALUES(location),
       estimated_delivery = VALUES(estimated_delivery)`,
      [orderId, status, location.longitude, location.latitude, estimated_delivery]
    );

    // Update order status if provided
    if (status) {
      await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
    }

    res.json({ message: 'Tracking information updated successfully' });
  } catch (error) {
    console.error('Error updating tracking information:', error);
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
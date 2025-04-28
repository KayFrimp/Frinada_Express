const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all orders (admin and rider)
router.get('/', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.username as customer_name, r.username as rider_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      LEFT JOIN users r ON o.rider_id = r.id
    `);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [order] = await pool.query(
      `SELECT o.*, u.username as customer_name, r.username as rider_name 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       LEFT JOIN users r ON o.rider_id = r.id 
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new order
router.post('/', authenticateToken, authorizeRole(['customer']), async (req, res) => {
  try {
    const { user_id, items, total_amount, delivery_address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, items, total_amount, delivery_address, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, JSON.stringify(items), total_amount, delivery_address, 'pending']
    );

    res.status(201).json({
      message: 'Order created successfully',
      orderId: result.insertId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status
router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'rider']), async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign rider to order
router.put('/:id/assign-rider', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { rider_id } = req.body;
    const [result] = await pool.query(
      'UPDATE orders SET rider_id = ?, status = ? WHERE id = ?',
      [rider_id, 'assigned', req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Rider assigned successfully' });
  } catch (error) {
    console.error('Error assigning rider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
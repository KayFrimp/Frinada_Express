const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all orders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        CONCAT(r.first_name, ' ', r.last_name) as rider_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users r ON o.rider_id = r.id
      ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        CONCAT(r.first_name, ' ', r.last_name) as rider_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users r ON o.rider_id = r.id
      WHERE o.id = ?`,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      pickup_address,
      delivery_address,
      pickup_latitude,
      pickup_longitude,
      delivery_latitude,
      delivery_longitude,
      items,
      total_amount
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO orders (
        user_id, pickup_address, delivery_address,
        pickup_latitude, pickup_longitude,
        delivery_latitude, delivery_longitude,
        items, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        pickup_address,
        delivery_address,
        pickup_latitude,
        pickup_longitude,
        delivery_latitude,
        delivery_longitude,
        JSON.stringify(items),
        total_amount,
        'pending'
      ]
    );

    const [order] = await pool.query(
      `SELECT o.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [result.insertId]
    );

    res.status(201).json(order[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
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
router.patch('/:id/assign', authenticateToken, authorizeRole(['admin']), async (req, res) => {
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
const { pool } = require('../config/database');

class Order {
  constructor(data) {
    this.id = data.id;
    this.customer_name = data.customer_name;
    this.customer_phone = data.customer_phone;
    this.pickup_address = data.pickup_address;
    this.dropoff_address = data.dropoff_address;
    this.distance = data.distance;
    this.price = data.price;
    this.status = data.status;
    this.assigned_rider_id = data.assigned_rider_id;
    this.created_by_admin_id = data.created_by_admin_id;
    this.created_at = data.created_at;
  }

  // Find order by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
      return rows.length ? new Order(rows[0]) : null;
    } catch (error) {
      console.error('Error finding order by ID:', error);
      throw error;
    }
  }

  // Find orders by rider ID
  static async findByRiderId(riderId) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE assigned_rider_id = ? ORDER BY created_at DESC', [riderId]);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('Error finding orders by rider ID:', error);
      throw error;
    }
  }

  // Find orders by admin ID
  static async findByAdminId(adminId) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE created_by_admin_id = ? ORDER BY created_at DESC', [adminId]);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('Error finding orders by admin ID:', error);
      throw error;
    }
  }

  // Get all orders with optional filters
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM orders';
      const values = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        values.push(filters.status);
      }

      if (filters.startDate) {
        conditions.push('created_at >= ?');
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push('created_at <= ?');
        values.push(filters.endDate);
      }

      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await pool.query(query, values);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('Error finding orders:', error);
      throw error;
    }
  }

  // Create a new order
  static async create(orderData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO orders (
          customer_name, customer_phone, pickup_address, dropoff_address,
          distance, price, status, created_by_admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.customer_name,
          orderData.customer_phone,
          orderData.pickup_address,
          orderData.dropoff_address,
          orderData.distance,
          orderData.price,
          orderData.status || 'pending',
          orderData.created_by_admin_id
        ]
      );

      return await Order.findById(result.insertId);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Update order
  async update(updateData) {
    try {
      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      values.push(this.id);

      await pool.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await Order.findById(this.id);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Assign rider to order
  async assignRider(riderId) {
    try {
      await pool.query(
        'UPDATE orders SET status = ?, assigned_rider_id = ? WHERE id = ?',
        ['assigned', riderId, this.id]
      );
      return await Order.findById(this.id);
    } catch (error) {
      console.error('Error assigning rider to order:', error);
      throw error;
    }
  }

  // Update order status
  async updateStatus(status) {
    try {
      await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, this.id]
      );
      return await Order.findById(this.id);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Delete order
  async delete() {
    try {
      await pool.query('DELETE FROM orders WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}

module.exports = Order; 
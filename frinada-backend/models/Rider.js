const { pool } = require('../config/database');
const User = require('./User');

class Rider {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.is_available = data.is_available;
    this.last_assigned = data.last_assigned;
    this.user = data.user; // Will be populated when needed
  }

  // Find rider by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM riders WHERE id = ?', [id]);
      if (!rows.length) return null;

      const rider = new Rider(rows[0]);
      const user = await User.findById(rider.user_id);
      rider.user = user;
      return rider;
    } catch (error) {
      console.error('Error finding rider by ID:', error);
      throw error;
    }
  }

  // Find rider by user ID
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.query('SELECT * FROM riders WHERE user_id = ?', [userId]);
      if (!rows.length) return null;

      const rider = new Rider(rows[0]);
      const user = await User.findById(rider.user_id);
      rider.user = user;
      return rider;
    } catch (error) {
      console.error('Error finding rider by user ID:', error);
      throw error;
    }
  }

  // Get all available riders
  static async findAvailable() {
    try {
      const [rows] = await pool.query('SELECT * FROM riders WHERE is_available = true');
      const riders = [];

      for (const row of rows) {
        const rider = new Rider(row);
        const user = await User.findById(rider.user_id);
        rider.user = user;
        riders.push(rider);
      }

      return riders;
    } catch (error) {
      console.error('Error finding available riders:', error);
      throw error;
    }
  }

  // Create a new rider
  static async create(userId) {
    try {
      // Check if user exists and is a rider
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.role !== 'rider') {
        throw new Error('User is not a rider');
      }

      // Check if rider already exists
      const existingRider = await Rider.findByUserId(userId);
      if (existingRider) {
        throw new Error('Rider already exists for this user');
      }

      // Create rider
      const [result] = await pool.query(
        'INSERT INTO riders (user_id, is_available) VALUES (?, ?)',
        [userId, true]
      );

      return await Rider.findById(result.insertId);
    } catch (error) {
      console.error('Error creating rider:', error);
      throw error;
    }
  }

  // Update rider availability
  async updateAvailability(isAvailable) {
    try {
      await pool.query(
        'UPDATE riders SET is_available = ? WHERE id = ?',
        [isAvailable, this.id]
      );
      this.is_available = isAvailable;
      return this;
    } catch (error) {
      console.error('Error updating rider availability:', error);
      throw error;
    }
  }

  // Update last assigned time
  async updateLastAssigned() {
    try {
      await pool.query(
        'UPDATE riders SET last_assigned = CURRENT_TIMESTAMP WHERE id = ?',
        [this.id]
      );
      this.last_assigned = new Date();
      return this;
    } catch (error) {
      console.error('Error updating rider last assigned time:', error);
      throw error;
    }
  }

  // Get rider's current orders
  async getCurrentOrders() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM orders 
         WHERE assigned_rider_id = ? 
         AND status IN ('assigned', 'picked_up')
         ORDER BY created_at DESC`,
        [this.user_id]
      );
      return rows.map(row => ({
        ...row,
        rider: {
          id: this.id,
          user_id: this.user_id,
          is_available: this.is_available,
          user: this.user
        }
      }));
    } catch (error) {
      console.error('Error getting rider current orders:', error);
      throw error;
    }
  }

  // Delete rider
  async delete() {
    try {
      await pool.query('DELETE FROM riders WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting rider:', error);
      throw error;
    }
  }
}

module.exports = Rider; 
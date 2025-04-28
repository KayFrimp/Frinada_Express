const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.status = data.status;
    this.created_at = data.created_at;
  }

  // Get full name
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows.length ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows.length ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by phone
  static async findByPhone(phone) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
      return rows.length ? new User(rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Insert user into database
      const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.phone,
          hashedPassword,
          userData.role || 'rider',
          userData.status || 'active'
        ]
      );

      // Get the created user
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return new User(rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  }

  // Update user
  async update(updateData) {
    try {
      const updateFields = [];
      const values = [];

      // Build update query dynamically
      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      // Add id to values array
      values.push(this.id);

      // Execute update query
      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      // Get updated user
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [this.id]);
      return new User(rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User; 
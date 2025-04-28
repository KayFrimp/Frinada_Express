# Frinada Backend API

A RESTful API for user authentication with bcrypt password hashing and MySQL database.

## Features

- User registration with password hashing
- User login with JWT authentication
- Protected routes with middleware
- Role-based authorization
- MySQL database integration

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=frinada
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   ```
4. Set up the database:
   - Make sure MySQL is installed and running
   - Run the SQL script in `config/schema.sql` to create the database and tables
5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`

- **POST /api/auth/login** - Login user
  - Body: `{ "email": "john@example.com", "password": "password123" }`

- **GET /api/auth/me** - Get current user profile (Protected)
  - Headers: `Authorization: Bearer <token>`

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes require a valid JWT token
- Role-based authorization for admin routes

## Technologies Used

- Node.js
- Express.js
- MySQL with mysql2
- bcryptjs for password hashing
- jsonwebtoken for JWT authentication 
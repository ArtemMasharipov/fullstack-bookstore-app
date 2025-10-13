# Bookstore Backend API

Clean MVC architecture for fullstack bookstore application.

## Architecture

```
backend/
├── config/           # Application configuration
│   ├── default.js    # Centralized configuration
│   ├── database.js   # Database connection
│   └── index.js      # Exports
├── controllers/      # HTTP handlers (thin layer)
├── services/         # Business logic
├── models/           # Mongoose schemas
├── routes/           # Route definitions
├── middleware/       # Middleware (auth, errors, async)
├── utils/            # Utilities (errors)
└── server.js         # Entry point
```

### Application Layers

**Model** → **Service** → **Controller** → **Routes**

- **Config**: Centralized configuration, environment variables
- **Models**: Data schemas, validation, virtual fields
- **Services**: All business logic, throws errors
- **Controllers**: HTTP request/response, calls services
- **Routes**: Endpoint definitions + middleware

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bookstore

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
CORS_METHODS=GET,POST,PUT,PATCH,DELETE
CORS_CREDENTIALS=true
```

> **⚠️ Important:** Change `JWT_SECRET` to a random string in production!

### Run Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will start at: `http://localhost:3000`

## Modules

### Books
- CRUD operations
- Search and filtering
- Category management
- Author relationships

### Authors
- CRUD operations
- Author statistics
- Author's books list

### Authentication
- User registration and login
- JWT tokens
- Profile management
- Roles: user, admin, moderator

### Cart
- Add/remove items
- Price synchronization
- Validation before checkout

### Orders
- Order creation
- Order statuses
- Order history
- Admin management

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - User profile
- `PUT /api/v1/auth/profile` - Update profile

### Books
- `GET /api/v1/books` - Get books list
- `GET /api/v1/books/:id` - Get book by ID
- `POST /api/v1/books` - Create book (admin)
- `PUT /api/v1/books/:id` - Update book (admin)
- `DELETE /api/v1/books/:id` - Delete book (admin)

### Authors
- `GET /api/v1/authors` - Get authors list
- `GET /api/v1/authors/:id` - Get author by ID
- `POST /api/v1/authors` - Create author (admin)
- `PUT /api/v1/authors/:id` - Update author (admin)
- `DELETE /api/v1/authors/:id` - Delete author (admin)

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/add` - Add to cart
- `PUT /api/v1/cart/update` - Update quantity
- `DELETE /api/v1/cart/remove/:id` - Remove from cart
- `DELETE /api/v1/cart/clear` - Clear cart

### Orders
- `GET /api/v1/orders` - Get user orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/status` - Update status (admin)

### Users (Admin)
- `GET /api/v1/users` - Get users list (admin)
- `GET /api/v1/users/:id` - Get user by ID (admin)
- `POST /api/v1/users` - Create user (admin)
- `PUT /api/v1/users/:id` - Update user (admin)
- `DELETE /api/v1/users/:id` - Delete user (admin)

Protected endpoints require JWT token in `Authorization: Bearer <token>` header.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description"
}
```

## Authentication

After successful login, server returns JWT token:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

Use token in header for protected endpoints:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## User Roles

- **user** - Regular user (purchases, cart, orders)
- **admin** - Administrator (full access)

## Dependencies

### Production
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT tokens
- **bcrypt** - Password hashing
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP logging

### Development
- **nodemon** - Auto-reload

## License

MIT License

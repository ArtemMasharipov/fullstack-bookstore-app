# Fullstack Bookstore App

A modern e-commerce bookstore application built with Vue 3 and Node.js.

## Features

- User authentication and authorization
- Book catalog with search and filtering
- Shopping cart functionality
- Order management system
- Admin panel for content management
- Responsive design

## Tech Stack

**Frontend:** Vue 3, Pinia, Vuetify 3, Vue Router 4, Vite  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd fullstack-bookstore-app

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Environment Setup

Create `backend/.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your-secret-key
```

### Run Application

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Project Structure

```
├── backend/           # Node.js API
│   ├── controllers/   # Request handlers
│   ├── services/      # Business logic
│   ├── models/        # Data models
│   ├── middleware/    # Middleware functions
│   └── routes/        # API routes
└── frontend/          # Vue.js SPA
    ├── src/
    │   ├── components/ # Vue components
    │   ├── views/      # Page components
    │   ├── store/      # Pinia stores
    │   ├── services/   # API services
    │   └── router/     # Routing
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - User profile

### Books
- `GET /api/v1/books` - Get books list
- `GET /api/v1/books/:id` - Get book details
- `POST /api/v1/books` - Create book (admin)
- `PUT /api/v1/books/:id` - Update book (admin)
- `DELETE /api/v1/books/:id` - Delete book (admin)

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/add` - Add to cart
- `PUT /api/v1/cart/update` - Update quantity
- `DELETE /api/v1/cart/remove/:id` - Remove from cart

### Orders
- `GET /api/v1/orders` - Get user orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details

## Development

```bash
# Backend
npm start          # Start server
npm run dev        # Development mode

# Frontend
npm run dev        # Development mode
npm run build      # Production build
npm run lint       # Code linting
```

## Documentation

This project follows clean architecture principles with separation of concerns between frontend and backend components.

## License

MIT License
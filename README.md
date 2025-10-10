# Fullstack Bookstore App

A modern fullstack bookstore application built with Vue 3, Pinia, Vuetify, and Node.js.

## Features

- **Frontend**: Vue 3 + Pinia + Vuetify
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT-based auth system
- **Admin Panel**: Book and user management
- **Shopping Cart**: Add/remove books, quantity management
- **Orders**: Order history and management
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- Vue 3 (Composition API)
- Pinia (State Management)
- Vuetify 3 (UI Framework)
- Vue Router 4
- Axios (HTTP Client)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Clean Architecture (DDD)

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd fullstack-bookstore-app
```

2. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Environment Setup
```bash
# Backend - create .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB connection string
```

4. Start the application
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Project Structure

```
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── application/     # Use cases
│   │   ├── domain/          # Entities & repositories
│   │   ├── infrastructure/  # Database & external services
│   │   └── presentation/    # Controllers & routes
├── frontend/                # Vue.js SPA
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── composables/     # Composition API functions
│   │   ├── store/           # Pinia stores
│   │   ├── services/        # API services
│   │   └── views/           # Page components
└── README.md
```

## Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test            # Run tests
```

### Frontend Commands
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## API Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/books` - Get books list
- `POST /api/v1/books` - Create book (admin)
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart` - Add to cart
- `GET /api/v1/orders` - Get user orders

## License

MIT License
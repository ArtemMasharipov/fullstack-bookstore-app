# 📚 Bookstore Application

> **Status**: 🚧 In Development  
> **Backend**: ✅ Production Ready  
> **Frontend**: 🔄 In Progress

A modern, full-stack bookstore application built with **Vue.js 3** (frontend) and **Node.js/Express** (backend), featuring user authentication, book management, shopping cart functionality, and admin panel.

## 🎯 Project Overview

This project demonstrates modern web development practices including:
- **Clean Architecture** patterns
- **RESTful API** design
- **JWT Authentication** 
- **Role-based Access Control**
- **File Upload** (Cloudinary integration)
- **Responsive Design** (Vuetify 3)
- **State Management** (Pinia)

## 🏗️ Architecture

```
📦 bookstore-app/
├── 🖥️ backend/          # Node.js/Express API (✅ Complete)
│   ├── src/
│   │   ├── domain/       # Business logic & entities
│   │   ├── application/  # Use cases & services
│   │   ├── infrastructure/ # Database & external services
│   │   ├── presentation/ # Controllers & routes
│   │   └── shared/       # Utilities & constants
│   ├── config/          # Environment configuration
│   └── server.js        # Application entry point
│
└── 🎨 frontend/         # Vue.js 3 SPA (🔄 In Progress)
    ├── src/
    │   ├── components/   # Reusable Vue components
    │   ├── views/        # Page components
    │   ├── store/        # Pinia state management
    │   ├── router/       # Vue Router configuration
    │   ├── composables/  # Composition API logic
    │   └── services/     # API communication
    └── public/          # Static assets
```

## ✅ Backend - Complete & Production Ready

### 🔧 Tech Stack
- **Node.js** with ES6 modules
- **Express.js** framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Cloudinary** for image storage
- **bcrypt** for password hashing
- **express-validator** for input validation

### 🏛️ Clean Architecture Implementation

```
Domain Layer (Business Logic)
├── Entities: User, Book, Author, Cart, Order, Role
├── Repositories: Abstract interfaces
└── Services: Domain business rules

Application Layer (Use Cases)
├── BookUseCases: CRUD operations
├── UserUseCases: Authentication & profile
├── CartUseCases: Shopping cart logic
└── OrderUseCases: Order processing

Infrastructure Layer (Data & External Services)
├── MongoDB repositories implementation
├── Cloudinary file upload service
└── Database schemas & migrations

Presentation Layer (API Interface)
├── REST controllers
├── Route definitions
├── Middleware (auth, validation, error handling)
└── Request/Response formatting
```

### 🔐 Security Features
- JWT token-based authentication
- Role-based access control (Admin, User)
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Helmet security headers

### 📋 API Endpoints

#### Authentication
```http
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
POST /api/v1/auth/logout       # User logout
GET  /api/v1/auth/profile      # Get user profile
```

#### Books Management
```http
GET    /api/v1/books           # Get all books (public)
GET    /api/v1/books/:id       # Get book by ID
POST   /api/v1/books           # Create book (admin only)
PUT    /api/v1/books/:id       # Update book (admin only)
DELETE /api/v1/books/:id       # Delete book (admin only)
```

#### Cart & Orders
```http
GET    /api/v1/cart            # Get user cart
POST   /api/v1/cart/add        # Add item to cart
DELETE /api/v1/cart/:itemId    # Remove item from cart
POST   /api/v1/orders          # Create order
GET    /api/v1/orders          # Get user orders
```

### 🚀 Running Backend

```bash
cd backend
npm install
npm run dev          # Development mode
npm start           # Production mode
npm run dev:kill    # Kill existing processes & start
```

**Environment variables required** (`.env`):
```env
PORT=3000
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=bookstore
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔄 Frontend - In Progress

### 🔧 Tech Stack
- **Vue.js 3** with Composition API
- **Vuetify 3** UI framework
- **Pinia** state management
- **Vue Router** navigation
- **Axios** HTTP client
- **Vite** build tool

### ✅ Implemented Features
- ✅ User authentication (login/register)
- ✅ Book catalog with pagination
- ✅ Shopping cart functionality
- ✅ Responsive design
- ✅ Admin panel foundation
- ✅ Notification system
- ✅ Route guards & permissions

### 🔄 In Development
- 🔄 Admin book management interface
- 🔄 User profile management
- 🔄 Order history & tracking
- 🔄 Advanced search & filtering
- 🔄 Image upload components
- 🔄 Payment integration
- 🔄 Email notifications

### 🎨 UI/UX Features
- Modern Material Design 3
- Dark/Light theme support
- Mobile-first responsive design
- Loading states & animations
- Toast notifications
- Form validation with real-time feedback

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Domain entities & services
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete user workflows

### Frontend Testing  
- **Component Tests**: Vue component logic
- **Store Tests**: Pinia state management
- **E2E Tests**: User interaction flows

## 📈 Development Roadmap

### Phase 1: Backend Foundation ✅
- [x] Clean Architecture implementation
- [x] Authentication & authorization
- [x] CRUD operations for all entities
- [x] File upload functionality
- [x] API documentation
- [x] Error handling & validation

### Phase 2: Frontend Core 🔄
- [x] Basic Vue.js 3 setup
- [x] Authentication flow
- [x] Book catalog display
- [x] Shopping cart
- [ ] Admin panel completion
- [ ] User profile management
- [ ] Order management

### Phase 3: Advanced Features 📋
- [ ] Real-time notifications
- [ ] Payment gateway integration
- [ ] Email service integration
- [ ] Advanced search & recommendations
- [ ] Inventory management
- [ ] Analytics dashboard

### Phase 4: Production Deployment 🚀
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring & logging

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd bookstore-app

# Setup Backend
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev

# Setup Frontend (in new terminal)
cd ../frontend
npm install
npm run dev
```

## 📝 Technical Decisions & Rationale

### Backend Architecture
- **Clean Architecture**: Ensures maintainability and testability
- **Repository Pattern**: Abstracts data access layer
- **JWT Authentication**: Stateless, scalable authentication
- **Mongoose ODM**: Type safety and schema validation

### Frontend Architecture
- **Composition API**: Better TypeScript support and reusability
- **Pinia**: Modern state management with DevTools support
- **Vuetify 3**: Comprehensive Material Design components
- **Composables**: Reusable business logic

## 🔍 Code Quality

- **ESLint** + **Prettier** for consistent code formatting
- **Conventional Commits** for clear commit history
- **Husky** git hooks for pre-commit validation
- **Clean Code** principles throughout codebase

## 📊 Performance Considerations

- Database indexing for optimized queries
- Image optimization with Cloudinary
- Lazy loading for Vue components
- API response caching
- Bundle splitting with Vite

## 🔒 Security Measures

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure headers configuration

## � Documentation

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| **[📋 PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | Quick overview for technical interviews | HR, Tech Leads |
| **[🔧 API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)** | Complete API reference | Developers, QA |
| **[🚀 INSTALLATION.md](./INSTALLATION.md)** | Setup and deployment guide | DevOps, Developers |
| **[🏗️ TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** | Architecture decisions and patterns | Senior Developers, Architects |

## �📞 Contact & Support

This project showcases modern full-stack development skills and is ready for code review and team collaboration.

**Developer**: Artem Masharipov  

---

> **Note**: This project is actively developed and demonstrates proficiency in modern web technologies, clean architecture patterns, and professional development practices. Ready for production deployment upon frontend completion.

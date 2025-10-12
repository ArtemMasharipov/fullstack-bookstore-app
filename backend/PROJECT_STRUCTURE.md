# Project Structure

## Directory Layout

```
backend/
│
├── config/                    # Application Configuration
│   ├── default.js            # Main config (env vars)
│   ├── database.js           # MongoDB connection
│   ├── index.js              # Exports
│   ├── README.md             # Config documentation
│   ├── QUICK_REFERENCE.md    # Quick reference guide
│   └── ARCHITECTURE.md       # Visual diagrams
│
├── controllers/              # HTTP Request Handlers
│   ├── authController.js    # Authentication
│   ├── authorController.js  # Authors
│   ├── bookController.js    # Books
│   ├── cartController.js    # Shopping cart
│   ├── orderController.js   # Orders
│   └── userController.js    # User management
│
├── services/                 # Business Logic Layer
│   ├── authService.js       # Auth logic
│   ├── authorService.js     # Author operations
│   ├── bookService.js       # Book operations
│   ├── cartService.js       # Cart operations
│   ├── orderService.js      # Order processing
│   └── userService.js       # User operations
│
├── models/                   # Database Models (Mongoose)
│   ├── Author.js            # Author schema
│   ├── Book.js              # Book schema
│   ├── Cart.js              # Cart schema
│   ├── Order.js             # Order schema
│   └── User.js              # User schema
│
├── routes/                   # API Route Definitions
│   ├── index.js             # Main router
│   ├── auth.js              # Auth routes
│   ├── authors.js           # Author routes
│   ├── books.js             # Book routes
│   ├── cart.js              # Cart routes
│   ├── orders.js            # Order routes
│   └── users.js             # User routes
│
├── middleware/               # Express Middleware
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Global error handler
│   └── asyncHandler.js      # Async wrapper
│
├── utils/                    # Utility Functions
│   └── errors.js            # Custom error classes
│
├── docs/                     # Documentation
│   ├── CONFIG_REFACTORING.md     # Config changes
│   ├── REFACTORING_SUMMARY.md    # Refactoring summary
│   └── archive/                  # Old documents
│       ├── CLEANUP_REPORT.md
│       ├── CLEAN_MVC_GUIDE.md
│       ├── PROGRESS.md
│       ├── REFACTORING_COMPLETE.md
│       └── SUMMARY.md
│
├── .env                      # Environment variables (git ignored)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── CHANGELOG.md             # Version history
├── package.json             # Dependencies and scripts
├── README.md                # Main documentation
└── server-clean-mvc.js      # Application entry point
```

## Data Flow

```
HTTP Request
    ↓
[Routes] - Define endpoints, apply middleware
    ↓
[Middleware] - Auth, validation, etc.
    ↓
[Controllers] - Handle request/response
    ↓
[Services] - Business logic
    ↓
[Models] - Database operations
    ↓
MongoDB
```

## Key Files

### Entry Point

- **server-clean-mvc.js** - Starts the application, connects to DB, sets up middleware

### Configuration

- **config/default.js** - All environment variables and settings
- **config/database.js** - MongoDB connection with error handling
- **.env** - Environment-specific values (not in git)

### Core Components

- **controllers/** - Thin layer, delegates to services
- **services/** - All business logic lives here
- **models/** - Database schemas and validation
- **routes/** - URL to controller mapping
- **middleware/** - Reusable request processors

### Documentation

- **README.md** - API documentation and getting started
- **CHANGELOG.md** - Version history
- **config/README.md** - Configuration guide
- **docs/** - Additional documentation

## Module Dependencies

```
Routes → Controllers → Services → Models
   ↓         ↓            ↓
Middleware  Utils       Config
```

### No Circular Dependencies

- Models don't import Services
- Services don't import Controllers
- Controllers don't import Routes
- Utils are standalone

## File Naming Conventions

- **camelCase** for files: `authController.js`, `bookService.js`
- **PascalCase** for models: `User.js`, `Book.js`
- **UPPERCASE** for docs: `README.md`, `CHANGELOG.md`
- **kebab-case** for multi-word configs: `server-clean-mvc.js`

## Import Patterns

```javascript
// Config (always from config/index.js)
import { config, connectDatabase } from './config/index.js'

// Models (direct import)
import User from '../models/User.js'

// Services (named exports)
import * as authService from '../services/authService.js'

// Utils (named exports)
import { NotFoundError } from '../utils/errors.js'

// Middleware (named exports)
import { protect, authorize } from '../middleware/auth.js'
```

## Environment-Based Behavior

### Development

- Detailed error messages
- Console logging
- Auto-reload with nodemon

### Production

- Minimal error details
- Structured logging
- Performance optimization

## Quick Commands

```bash
# Development
npm run dev          # Start with auto-reload

# Production
npm start            # Start server

# Utilities
npm run dev:kill     # Kill node processes and restart
```

## Best Practices

✅ **Do:**

- Keep controllers thin (delegate to services)
- Put all business logic in services
- Use async/await consistently
- Import config from `config/index.js`
- Handle errors in services
- Use middleware for cross-cutting concerns

❌ **Don't:**

- Put business logic in controllers
- Access `process.env` directly (use config)
- Mix concerns between layers
- Create circular dependencies
- Ignore errors

## Port Usage

- **3000** - Backend API (default)
- **8080** - Frontend (CORS configured)
- **27017** - MongoDB (default local)

## Authentication Flow

```
1. User registers/logs in
2. Server generates JWT token
3. Client stores token
4. Client sends token in Authorization header
5. Middleware validates token
6. Request proceeds to controller
7. Controller uses req.user (from token)
```

## Error Handling Flow

```
1. Service throws custom error
2. Error bubbles up to controller
3. asyncHandler catches error
4. errorHandler middleware formats response
5. Client receives JSON error
```

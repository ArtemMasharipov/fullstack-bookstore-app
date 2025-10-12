# Changelog

All notable changes to the Bookstore Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2025-10-12

### Added

- **Configuration Module** - Centralized configuration management

  - `config/default.js` - Main configuration object
  - `config/database.js` - Database connection module
  - `config/index.js` - Clean export interface
  - Support for both `MONGODB_URI` and `MONGODB_URL + DATABASE_NAME`
  - Immutable configuration with `Object.freeze()`

- **Documentation**
  - `config/README.md` - Configuration usage guide
  - `config/QUICK_REFERENCE.md` - Developer quick reference
  - `config/ARCHITECTURE.md` - Visual architecture diagrams
  - `.env.example` - Environment variables template

### Changed

- **Refactored Configuration Access**

  - `server-clean-mvc.js` - Now uses `config` module and `connectDatabase()`
  - `middleware/auth.js` - Uses `config.jwt.secret`
  - `middleware/errorHandler.js` - Uses `config.nodeEnv`
  - `services/authService.js` - Uses `config.jwt.*`
  - All `process.env` access centralized in `config/default.js`

- **Environment Variables**

  - Added `NODE_ENV` variable
  - Changed `JWT_EXPIRE` → `JWT_EXPIRATION` for consistency
  - Updated CORS configuration format
  - Better documentation in `.env` file

- **Documentation Structure**
  - Moved old docs to `docs/archive/`
  - Moved refactoring docs to `docs/`
  - Updated main `README.md` with config information

### Removed

- Duplicate `dotenv.config()` calls across files
- Scattered `process.env` access throughout codebase
- Old `query` file (contained only "MongoDB")
- Redundant documentation files from root

### Fixed

- Consistent configuration access pattern
- Proper graceful shutdown handling in database connection
- CORS methods configuration (added PATCH, removed OPTIONS)

## [1.0.0] - 2024

### Added

- Initial Clean MVC architecture implementation
- Complete API with 46 endpoints
- Authentication and authorization (JWT)
- Role-based access control (user, moderator, admin)
- Books, Authors, Users, Cart, Orders modules
- Centralized error handling
- Database models and services
- Comprehensive documentation

### Security

- JWT token authentication
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- Input validation

---

## Version History

- **1.1.0** - Configuration refactoring and cleanup
- **1.0.0** - Initial Clean MVC implementation

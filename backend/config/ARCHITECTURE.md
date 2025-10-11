# Configuration Architecture

## Before Refactoring

```
┌─────────────────────────────────────────────────────────┐
│                     .env file                            │
│  PORT, MONGODB_URI, JWT_SECRET, CORS_ORIGIN, etc.       │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  server.js   │  │   auth.js    │  │ authService  │
│ process.env  │  │ process.env  │  │ process.env  │
│   .PORT      │  │  .JWT_SECRET │  │  .JWT_SECRET │
│ .MONGODB_URI │  │              │  │  .JWT_EXPIRE │
│ .CORS_ORIGIN │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        ↓                 ↓                 ↓
   ❌ Duplicated    ❌ Scattered    ❌ No central
      config           access          validation
```

## After Refactoring

```
┌─────────────────────────────────────────────────────────┐
│                     .env file                            │
│  PORT, MONGODB_URI, JWT_SECRET, CORS_ORIGIN, etc.       │
└─────────────────────────────────────────────────────────┘
                          ↓
                  ┌───────────────┐
                  │  config/      │
                  │  default.js   │
                  │  - Load .env  │
                  │  - Validate   │
                  │  - Freeze     │
                  └───────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  server.js   │  │   auth.js    │  │ authService  │
│              │  │              │  │              │
│ config.port  │  │ config.jwt   │  │ config.jwt   │
│ config.cors  │  │   .secret    │  │   .secret    │
│              │  │              │  │   .expiresIn │
└──────────────┘  └──────────────┘  └──────────────┘
        ↓                 ↓                 ↓
   ✅ Centralized   ✅ Consistent   ✅ Type-safe
      config           access          structured
```

## Configuration Flow

```
1. Application Start
   ↓
2. config/default.js loads
   ↓
3. dotenv.config() reads .env
   ↓
4. Configuration object created
   {
     port: 3000,
     nodeEnv: 'development',
     database: {
       name: 'bookStoreDB',
       url: 'mongodb://...',
       uri: 'mongodb://.../bookStoreDB'
     },
     jwt: {
       secret: '...',
       expiresIn: '7d'
     },
     cors: {
       origin: 'http://localhost:8080',
       methods: ['GET', 'POST', ...]
     }
   }
   ↓
5. Object.freeze(config)
   ↓
6. Exported to all modules
   ↓
7. Used throughout application
```

## Database Connection Flow

```
1. server-clean-mvc.js starts
   ↓
2. Import { connectDatabase }
   ↓
3. Call await connectDatabase()
   ↓
4. config/database.js executes
   ↓
5. mongoose.connect(config.database.uri)
   ↓
6. Connection event listeners set up
   ↓
7. Success ✅ or Error ❌
   ↓
8. Server continues startup
```

## Key Improvements

### 1. Single Source of Truth

```
Before: process.env.JWT_SECRET in 3+ files
After:  config.jwt.secret from 1 file
```

### 2. Structured Access

```
Before: process.env.JWT_SECRET
        process.env.JWT_EXPIRE
        process.env.JWT_AUDIENCE
After:  config.jwt.secret
        config.jwt.expiresIn
        config.jwt.audience
```

### 3. Immutability

```
Before: Can accidentally modify process.env
After:  Object.freeze() prevents modifications
```

### 4. Easy Testing

```
Before: Mock process.env in each test
After:  Mock config object once
```

### 5. Documentation

```
Before: Scattered env vars, unclear structure
After:  Clear hierarchy in config/default.js
```

## Import Patterns

### Old Pattern

```javascript
import dotenv from 'dotenv'
dotenv.config()

const secret = process.env.JWT_SECRET || 'default'
const port = process.env.PORT || 5000
```

### New Pattern

```javascript
import { config } from './config/index.js'

const secret = config.jwt.secret
const port = config.port
```

## Benefits Summary

| Aspect            | Before                       | After                  |
| ----------------- | ---------------------------- | ---------------------- |
| **Location**      | Scattered across files       | Centralized in config/ |
| **Duplicates**    | Multiple `process.env` calls | Single config object   |
| **Type Safety**   | Strings only                 | Structured object      |
| **Validation**    | None                         | Can add validators     |
| **Documentation** | Unclear                      | Self-documenting       |
| **Testing**       | Hard to mock                 | Easy to mock           |
| **Maintenance**   | Update multiple files        | Update one place       |
| **Immutability**  | Mutable                      | Frozen object          |

# Quick Reference: Configuration Module

## Import

```javascript
// Import config and/or database connection
import { config, connectDatabase } from './config/index.js'
```

## Usage Examples

### Server Configuration

```javascript
app.listen(config.port)
// Instead of: process.env.PORT || 5000
```

### Environment

```javascript
if (config.nodeEnv === 'development') {
  // Development mode
}
// Instead of: process.env.NODE_ENV === 'development'
```

### Database

```javascript
// Connect to database
await connectDatabase()

// Access database config
console.log(config.database.uri) // Full MongoDB URI
console.log(config.database.name) // Database name
// Instead of: process.env.MONGODB_URI
```

### JWT

```javascript
// Sign token
jwt.sign(payload, config.jwt.secret, {
  expiresIn: config.jwt.expiresIn,
})

// Verify token
jwt.verify(token, config.jwt.secret)

// Instead of: process.env.JWT_SECRET, process.env.JWT_EXPIRE
```

### CORS

```javascript
app.use(cors(config.cors))
// Instead of: cors({ origin: process.env.CORS_ORIGIN, ... })
```

### Session

```javascript
session({
  secret: config.session.secret,
})
// Instead of: process.env.SESSION_SECRET
```

## Configuration Object Structure

```javascript
config = {
  port: Number,
  nodeEnv: String,

  database: {
    name: String,
    url: String,
    uri: String  // Auto-constructed or from MONGODB_URI
  },

  jwt: {
    secret: String,
    expiresIn: String,
    audience: String,
    issuer: String
  },

  cors: {
    origin: String,
    methods: Array<String>,
    credentials: Boolean,
    allowedHeaders: Array<String>
  },

  session: {
    secret: String
  }
}
```

## Environment Variables

### Database (choose one approach)

**Approach 1: Full URI (recommended for cloud)**

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.net/dbname
```

**Approach 2: Separate URL + Name (for local)**

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=bookStoreDB
```

### Other Variables

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:8080
```

See `.env.example` for complete list.

## Common Patterns

### Server Startup

```javascript
import { config, connectDatabase } from './config/index.js'

async function startServer() {
  await connectDatabase()
  app.listen(config.port, () => {
    console.log(`Server on port ${config.port}`)
  })
}

startServer()
```

### Conditional Development Code

```javascript
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
  // Show detailed errors
}
```

### Error Handling

```javascript
res.status(500).json({
  error: config.nodeEnv === 'development' ? error.message : 'Server error',
})
```

## Migration Cheat Sheet

| Old                          | New                                   |
| ---------------------------- | ------------------------------------- |
| `process.env.PORT`           | `config.port`                         |
| `process.env.NODE_ENV`       | `config.nodeEnv`                      |
| `process.env.MONGODB_URI`    | `config.database.uri`                 |
| `process.env.JWT_SECRET`     | `config.jwt.secret`                   |
| `process.env.JWT_EXPIRE`     | `config.jwt.expiresIn`                |
| `process.env.CORS_ORIGIN`    | `config.cors.origin`                  |
| `process.env.SESSION_SECRET` | `config.session.secret`               |
| `dotenv.config()`            | Not needed (handled by config module) |
| `mongoose.connect(uri)`      | `await connectDatabase()`             |

## Rules

✅ **DO**

- Import config at the top of files
- Use `config.xxx` for all configuration
- Use `connectDatabase()` for DB connections

❌ **DON'T**

- Access `process.env` directly (except in config/default.js)
- Modify config object (it's frozen)
- Import dotenv in other files (only in config/default.js)

## Need Help?

- 📖 Full docs: `config/README.md`
- 🏗️ Architecture: `config/ARCHITECTURE.md`
- 📋 Changes: `CONFIG_REFACTORING.md`
- 🎯 Summary: `REFACTORING_SUMMARY.md`

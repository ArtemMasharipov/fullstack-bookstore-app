# Configuration Module

This directory contains centralized configuration management for the backend application.

## Files

### `default.js`

Main configuration file that loads and exports all application settings from environment variables.

**Exports:**

- `config` - Frozen configuration object with all application settings

**Configuration Sections:**

- **Server**: Port, environment
- **Database**: MongoDB connection settings
- **JWT**: Token generation and validation settings
- **CORS**: Cross-Origin Resource Sharing settings
- **Session**: Session management settings

### `database.js`

Database connection module that handles MongoDB connection setup.

**Exports:**

- `connectDatabase()` - Async function that connects to MongoDB

**Features:**

- Automatic connection with error handling
- Connection event listeners
- Graceful shutdown on app termination

### `index.js`

Central export point for all configuration modules.

## Usage

### Import Configuration

```javascript
import { config } from './config/index.js'

// Access configuration
console.log(config.port)
console.log(config.database.uri)
console.log(config.jwt.secret)
```

### Connect to Database

```javascript
import { connectDatabase } from './config/index.js'

// In your server startup
async function startServer() {
  await connectDatabase()
  // ... start HTTP server
}
```

## Environment Variables

All configuration is loaded from environment variables defined in `.env` file.

### Database Configuration

**Option 1: Full URI (recommended for cloud databases)**

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

**Option 2: Separate URL and Name (for local databases)**

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=bookStoreDB
```

The configuration will automatically construct the URI from URL + NAME if MONGODB_URI is not provided.

### All Available Variables

See `.env.example` for a complete list of all available environment variables and their descriptions.

## Best Practices

1. **Never commit `.env` files** - These contain sensitive information
2. **Always use `.env.example`** - Keep this updated with all required variables
3. **Validate environment variables** - Check that required variables are set on startup
4. **Use frozen objects** - Configuration is immutable (`Object.freeze()`)
5. **Centralize access** - Always import from `config/index.js`

## Benefits of This Approach

✅ **Single Source of Truth** - All configuration in one place
✅ **Type Safety** - Structured configuration object
✅ **No Duplication** - No scattered `process.env` calls
✅ **Easy Testing** - Mock configuration easily
✅ **Documentation** - Clear structure shows all available settings
✅ **Immutability** - Frozen config prevents accidental changes

## Migration from Old Code

### Before

```javascript
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGODB_URI)
jwt.sign(payload, process.env.JWT_SECRET)
```

### After

```javascript
import { config, connectDatabase } from './config/index.js'

await connectDatabase()
app.listen(config.port)
jwt.sign(payload, config.jwt.secret)
```

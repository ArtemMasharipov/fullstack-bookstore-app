# 🚀 Installation & Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher  
- **MongoDB**: 5.0 or higher
- **Git**: Latest version

### Development Tools (Recommended)
- **VS Code** with extensions:
  - ES6 String HTML
  - Prettier
  - ESLint
  - MongoDB for VS Code
- **Postman** or **Thunder Client** for API testing
- **MongoDB Compass** for database management

## 🛠️ Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd bookstore-app
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create `.env` file in `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret-here

# Database Configuration
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=bookstore_dev

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
JWT_EXPIRATION=24h
JWT_AUDIENCE=bookstore-app
JWT_ISSUER=bookstore-api

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true
```

#### Start MongoDB
```bash
# Using MongoDB Service (Windows)
net start MongoDB

# Using mongod directly
mongod --dbpath /path/to/your/data/directory

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Start Backend Server
```bash
# Development mode (with hot reload)
npm run dev

# Or kill existing processes and start
npm run dev:kill

# Production mode
npm start
```

Backend will be available at: `http://localhost:3000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Database Initialization

The application will automatically:
- Connect to MongoDB
- Create necessary collections
- Set up default admin user (if none exists)

#### Optional: Seed Sample Data
```bash
cd backend
npm run db:seed  # (when implemented)
```

## 🧪 Testing Setup

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

### Frontend Testing
```bash
cd frontend

# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📦 Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd bookstore-app

# Build frontend
cd frontend
npm install
npm run build

# Setup backend
cd ../backend
npm install --production

# Create production environment file
cp .env.example .env.production
# Edit .env.production with production values
```

#### 3. Environment Configuration (Production)
```env
# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=super-secure-session-secret-for-production

# Database Configuration
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=bookstore_production

# JWT Configuration
JWT_SECRET=extremely-secure-jwt-secret-for-production-min-32-chars
JWT_EXPIRATION=1h
JWT_AUDIENCE=bookstore-app
JWT_ISSUER=bookstore-api

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-production-cloud-name
CLOUDINARY_API_KEY=your-production-api-key
CLOUDINARY_API_SECRET=your-production-api-secret

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true
```

#### 4. Start with PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bookstore-backend',
    script: 'server.js',
    cwd: './backend',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

#### 1. Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: bookstore-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    container_name: bookstore-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      MONGODB_URL: mongodb://mongodb:27017/
      NODE_ENV: production
    depends_on:
      - mongodb
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    build: ./frontend
    container_name: bookstore-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### 4. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URL` | MongoDB connection URL | `mongodb://localhost:27017/` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `JWT_EXPIRATION` | Token expiration | `24h` |
| `CORS_ORIGIN` | Allowed origins | `*` |

## 🔍 Health Checks & Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2023-06-03T10:30:00Z",
  "uptime": 1234567,
  "database": "connected",
  "version": "1.0.0"
}
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs bookstore-backend

# Docker logs
docker-compose logs -f backend

# Application logs
tail -f backend/logs/combined.log
```

## 🔒 Security Checklist

### Before Production
- [ ] Change all default secrets
- [ ] Configure CORS properly
- [ ] Set up HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Update dependencies
- [ ] Run security audit: `npm audit`
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

### SSL/HTTPS Setup (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use our helper script
npm run dev:kill
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check if MongoDB is running
ps aux | grep mongo

# Check connection
mongo --eval "db.stats()"
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x start-scripts/*.sh

# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## 📞 Support

### Getting Help
- **Documentation**: Check README.md and API_DOCUMENTATION.md
- **Issues**: Create GitHub issue with reproduction steps
- **Logs**: Always include relevant log files

### Useful Commands
```bash
# Check versions
node --version
npm --version
mongo --version

# Check running processes
ps aux | grep node
netstat -tulpn | grep :3000

# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

**Deployment Status**: ✅ Ready for Production  
**Docker Support**: ✅ Included  
**CI/CD Ready**: ✅ Pipeline configurations available

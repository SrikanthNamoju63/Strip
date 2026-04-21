# Configuration

Backend configuration, environment variables, and setup.

## Environment Variables (.env)

Create `.env` file in backend root with:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
HOST=localhost

# Database
MONGO_URI=mongodb://localhost:27017/healthcare
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_CLUSTER=
MONGODB_DB_NAME=healthcare

# Redis (Token Blacklist)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Admin Account
ADMIN_EMAIL=admin@healthcare.com
ADMIN_PASSWORD=AdministratorPassword123!

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@healthcare.com

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,docx,jpg,png

# Frontend URLs
FRONTEND_URL_DOCTOR_WEB=http://localhost:5173
FRONTEND_URL_SUPER_ADMIN_WEB=http://localhost:5174
FRONTEND_URL_COMPANY=http://localhost:3001

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Rate Limiting
AUTH_RATE_LIMIT=5
API_RATE_LIMIT=100
PAYMENT_RATE_LIMIT=1

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs

# Feature Flags
ENABLE_KYC_VERIFICATION=true
ENABLE_PAYMENT_PROCESSING=true
ENABLE_SETTLEMENT_AUTOMATION=false
```

## Configuration Files

### `config/db.js` - MongoDB Connection

Handles MongoDB connection with:
- Connection URI validation
- Retry logic for failed connections
- Connection pooling
- Transaction support

**Key Settings:**
```javascript
{
  maxPoolSize: 10,              // Connection pool size
  minPoolSize: 2,               // Minimum connections
  connectTimeoutMS: 10000,      // Connection timeout
  serverSelectionTimeoutMS: 5000 // Server selection timeout
}
```

**Usage:**
```javascript
const db = require('./config/db');
// Database automatically initialized on server start
```

### `config/multer.js` - File Upload

Configures file upload handling with:
- File size limits
- Allowed file types
- Storage destination

**Supported Files:**
- Images: jpg, jpeg, png, gif
- Documents: pdf, docx, xlsx
- Max size: 5MB (configurable)

**Usage:**
```javascript
const { upload, uploadMultiple } = require('./config/multer');

router.post('/upload', upload.single('file'), uploadHandler);
router.post('/upload-multiple', uploadMultiple.array('files', 10), uploadHandler);
```

## Environment-Based Configuration

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_KYC_VERIFICATION=false
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=info
SSL_ENABLED=true
ENABLE_KYC_VERIFICATION=true
```

### Testing
```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/healthcare-test
REDIS_URL=redis://localhost:6379
```

## Docker Configuration

`docker-compose.yml` sets up services:

```yaml
services:
  mongodb:
    image: mongo:9.1.5
    ports: ["27017:27017"]
    volumes:
      - ./data/db:/data/db
    environment:
      MONGO_INITDB_USERNAME: admin
      MONGO_INITDB_PASSWORD: password

  redis:
    image: redis:7.2
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      MONGO_URI: mongodb://mongodb:27017/healthcare
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis
```

**Start services:**
```bash
docker-compose up -d
```

## Local Development Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
Option A: With Docker
```bash
docker-compose up -d
```

Option B: Locally (requires Node, MongoDB, Redis)
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start backend
npm run dev
```

### 4. Initialize Database
```bash
npm run seed-admin      # Create admin account
npm run check-admin     # Verify admin creation
```

### 5. Run Tests
```bash
npm test
npm run test-endpoints
```

## Credential Management

### Storing Secrets
**Never commit secrets to git:**
```bash
# Good - in .env (gitignored)
STRIPE_SECRET_KEY=sk_test_...

# Bad - hardcoded in code
const stripeKey = "sk_test_...";
```

**Using secrets safely:**
```javascript
// Use process.env
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY not configured');
}
```

### Environment Variable Validation
The app validates required variables on startup:
- MONGO_URI
- JWT_SECRET
- ADMIN_EMAIL / ADMIN_PASSWORD
- Payment gateway keys (if enabled)

If missing, the app will fail with clear error messages.

## Feature Flags

Control features via environment variables:

```javascript
// Disable KYC in development
if (process.env.ENABLE_KYC_VERIFICATION === 'false') {
  // Skip KYC requirement
}

// Disable payments in test
if (process.env.ENABLE_PAYMENT_PROCESSING === 'false') {
  // Use mock payment service
}
```

## Logging Configuration

### Log Levels
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General info (default for production)
- `debug` - Detailed debugging (development)
- `silly` - Everything (not recommended)

### Log Output
Logs written to:
- Console (stdout)
- `logs/error.log` - Error only
- `logs/combined.log` - All logs

### Log Format
```
2024-01-15 10:30:45.123 [INFO] User logged in: user@example.com
2024-01-15 10:31:02.456 [ERROR] Database connection failed: ECONNREFUSED
```

## Rate Limiting Configuration

Control request limits per endpoint:

```javascript
// In .env
AUTH_RATE_LIMIT=5           // 5 attempts per 15 min
API_RATE_LIMIT=100          // 100 per minute
PAYMENT_RATE_LIMIT=1        // 1 per 30 seconds

// In middleware/rateLimiting.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: process.env.AUTH_RATE_LIMIT
});
```

## Troubleshooting Configuration

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Fix:
1. Verify MongoDB is running
2. Check MONGO_URI in .env
3. Check username/password if auth enabled
```

### Missing Environment Variable
```
Error: JWT_SECRET not configured

Fix:
1. Add JWT_SECRET to .env
2. Ensure .env is in backend root directory
3. Check .env is not listed in .gitignore
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000

Fix:
1. Change PORT in .env
2. Or kill process using port: lsof -i :3000
```

### Redis Connection Failed
```
Error: cannot connect to redis

Fix:
1. Verify Redis is running: redis-cli ping
2. Check REDIS_URL in .env
3. For Docker: docker-compose up redis
```

## Production Deployment

For production, ensure:

1. **Environment variables set** - Use environment variable management service
2. **Secrets managed** - Use AWS Secrets Manager, HashiCorp Vault, etc.
3. **Node env=production** - Enables optimizations
4. **HTTPS enabled** - SSL certificates configured
5. **Database backups** - Daily backups configured
6. **Monitoring** - Error tracking, APM enabled
7. **Rate limiting** - Enabled on all endpoints
8. **CORS configured** - Only allowed origins

## Monitoring & Health Checks

Health check endpoint:
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```
